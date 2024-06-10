import { Vehicle } from '@typeorm/entities/Vehicle';
import { BULL_JOB_RESULT, VehicleApi } from '@utils/types';
import { parseStringPromise } from 'xml2js';
import { DateTime } from 'luxon';
import { AppDataSource } from '@typeorm/typeorm';
import { InsertResult } from 'typeorm';

// Bus data comes in as XML
const fetchVehicleDataAsXml = async (): Promise<string> => {
  const VEHICLE_URL = `http://api.thebus.org/vehicle/?key=${process.env.API_KEY}`;

  const response = await fetch(VEHICLE_URL);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return await response.text();
};

// Bus XML does not properly escape ampersand. Update any ampersand to the correct HTML.
const cleanBusXml = (dirtyXml: string) => dirtyXml.replaceAll('&', '&amp;');

const parseXmlToJson = async (xml: string): Promise<VehicleApi[]> => {
  try {
    const json = await parseStringPromise(xml, {
      explicitArray: false, // Don't force arrays for single items
      ignoreAttrs: false, // Keep attributes, they can be useful
      mergeAttrs: true, // Merge attributes with the main object
      explicitRoot: false, // Don't wrap everything in a root object
      trim: true, // Trim whitespace from text nodes
      normalizeTags: true, // Convert all tags to lowercase for consistency
    });

    return json.vehicle;
  } catch (err) {
    if (err instanceof Error)
      throw new Error(`Unable to parse XML to JSON. Error: ${err.message}`);

    throw new Error('Unknown XML to JSON parsing error: ' + String(err));
  }
};

const transformToVehicleEntities = (vehicles: VehicleApi[]): Array<Vehicle> => {
  return vehicles.map(
    (data) =>
      new Vehicle({
        busNumber: data.number,
        tripID: data.trip,
        driver: data.driver,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        adherence: Number(data.adherence),
        heartbeat: DateTime.fromFormat(
          data.last_message,
          'M/d/yyyy h:mm:ss a',
          { zone: 'Pacific/Honolulu' }
        ).toJSDate(),
        routeName: data.route_short_name,
        headsign: data.headsign,
      })
  );
};

const saveVehicleEntities = async (
  entities: Vehicle[]
): Promise<InsertResult> => {
  try {
    const vehicleRepository = AppDataSource.getRepository(Vehicle);

    return vehicleRepository
      .createQueryBuilder()
      .insert()
      .values(entities)
      .orUpdate(
        [
          'trip_id',
          'driver',
          'latitude',
          'longitude',
          'adherence',
          'heartbeat',
          'route_name',
          'headsign',
        ],
        ['bus_number']
      )
      .execute();
  } catch (err) {
    throw new Error(
      `Unable to save Vehicle Entities. Error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
};

// Clean bus data. There are duplicate records that have the same bus number. Looks to be from multiple trips.
const cleanDuplicateBusNumbers = (vehicles: VehicleApi[]): VehicleApi[] => {
  const cleanVehicles = vehicles;
  const vehicleCount = {};
  const vehicleIndexes = {};
  const indexesToRemove = [];

  // Loop over VehicleApi array, and store key/pair { busNumber: 1 } in vehicleCount as well as the first index of that
  // busNumber in vehicleIndexes. If busNumber already exists in vehicleCount, then increment the value,
  // and append the index.
  vehicles.forEach((vehicle, index) => {
    const busNumber = vehicle.number;

    if (typeof busNumber !== 'undefined' && busNumber != '') {
      if (vehicleCount[busNumber]) {
        vehicleCount[busNumber] += 1;
        vehicleIndexes[busNumber].push(index);
      } else {
        vehicleCount[busNumber] = 1;
        vehicleIndexes[busNumber] = [index];
      }
    } else {
      console.log(vehicle);
      throw new Error('wtf');
    }
  });

  // Get the busNumbers that have multiple records.
  const duplicates = Object.keys(vehicleCount).filter(
    (busNumber) => vehicleCount[busNumber] > 1
  );

  // Knowing the duplicates, get the indexes of these buses.
  const duplicateIndexes = duplicates.map((busNumber) => ({
    busNumber,
    indexes: vehicleIndexes[busNumber],
  }));

  // Loop over all bus numbers with duplicates. Figure out which bus number object is the most recent. Add the
  // indexes of the older objects to indexesToRemove for filtering. Note there may be objects that are the same,
  // but with different trip IDs. If this is the case, then keep the first found object, but append all the trip IDs.
  duplicateIndexes.forEach(({ indexes }) => {
    let i = 0;
    let mostRecentIndexes = [indexes[0]];
    let badIndexes = [];

    // Loop over all the indexes for the duplicate vehicles and determine which data is the most recent.
    indexes.forEach((index, iteration) => {
      if (iteration === 0) {
        return;
      }

      const mostRecentTime = DateTime.fromFormat(
        vehicles[indexes[i]].last_message,
        'M/d/yyyy h:mm:ss a'
      );

      const time = DateTime.fromFormat(
        vehicles[index].last_message,
        'M/d/yyyy h:mm:ss a'
      );

      if (mostRecentTime.equals(time)) {
        mostRecentIndexes.push(index);
      } else if (time > mostRecentTime) {
        i = index;
        badIndexes = mostRecentIndexes;
        mostRecentIndexes = [index];
      } else {
        badIndexes.push(index);
        return;
      }
    });

    // Mark older timestamps for deletion. If multiple objects with the same timestamp, then append all the trip IDs
    // into one, store that in the first found object, and mark the other objects for deletion.
    if (mostRecentIndexes.length > 1) {
      const trips = mostRecentIndexes
        .map((index) => vehicles[index].trip)
        .join(', ');

      cleanVehicles[mostRecentIndexes[0]].trip = trips;

      for (let i = 1; i < mostRecentIndexes.length; i++) {
        indexesToRemove.push(mostRecentIndexes[i]);
      }
    } else {
      indexesToRemove.push(...badIndexes);
    }
  });

  // Remove all the indexes that are bad and return
  return cleanVehicles.filter((_, index) => !indexesToRemove.includes(index));
};

export const fetchAndEtlData = async (): Promise<BULL_JOB_RESULT> => {
  let response: BULL_JOB_RESULT = {
    status: 'failed',
    message: 'Initialization',
    startTime: new Date(),
  };

  try {
    const xml = cleanBusXml(await fetchVehicleDataAsXml());
    const json = cleanDuplicateBusNumbers(await parseXmlToJson(xml));

    const vehicleEntities = transformToVehicleEntities(json);
    const insertResult = await saveVehicleEntities(vehicleEntities);

    response = {
      ...response,
      status: 'success',
      message: `${insertResult.identifiers.length} successful upserts`,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    response = {
      ...response,
      status: 'failed',
      message: `Error: ${errorMessage}`,
    };
  }

  return {
    ...response,
    endTime: new Date(),
  };
};
