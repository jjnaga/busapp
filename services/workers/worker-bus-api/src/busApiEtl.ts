import { Vehicle } from '@utils/typeorm/entities/Vehicle';
import { AppDataSource } from '@utils/typeorm/typeorm';
import { BULL_JOB_RESULT, VehicleApi } from '@utils/types';
import { parseStringPromise } from 'xml2js';
import { DateTime } from 'luxon';
import { InsertResult } from 'typeorm';
import Redis from 'ioredis';

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

const parseXmlToJson = async (xml: string): Promise<object> => {
  try {
    const json = await parseStringPromise(xml, {
      explicitArray: false, // Don't force arrays for single items
      ignoreAttrs: false, // Keep attributes, they can be useful
      mergeAttrs: true, // Merge attributes with the main object
      explicitRoot: false, // Don't wrap everything in a root object
      trim: true, // Trim whitespace from text nodes
      normalizeTags: true, // Convert all tags to lowercase for consistency
    });

    if (json === null || typeof json !== 'object') {
      throw new Error('Invalid JSON object retrieved.');
    }

    return json;
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
        tripId: data.trip,
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

    console.log(entities[0]);
    return vehicleRepository
      .createQueryBuilder('vehicle')
      .insert()
      .values(entities)
      .orUpdate(
        [
          'tripId',
          'driver',
          'latitude',
          'longitude',
          'adherence',
          'heartbeat',
          'routeName',
          'headsign',
        ],
        ['busNumber'],
        { skipUpdateIfNoValuesChanged: true }
      )
      .returning([
        'busNumber',
        'tripId',
        'driver',
        'latitude',
        'longitude',
        'adherence',
        'heartbeat',
        'routeName',
        'headsign',
      ])
      .execute();
  } catch (err) {
    throw new Error(
      `Unable to save Vehicle Entities. Error: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
};

// Clean bus data. There are duplicate records that have the same bus number. Looks to be from multiple trips.
const cleanDuplicateBusNumbers = (vehicles: VehicleApi[]): VehicleApi[] => {
  const cleanVehicles = vehicles;
  const vehicleCount: { [key: string]: number } = {};
  const vehicleIndexes: { [key: string]: number[] } = {};
  const indexesToRemove: number[] = [];

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
  // but with different trip IDs. If this is the case, then keep the first found object and append all the trip IDs.
  duplicateIndexes.forEach(({ indexes }) => {
    let mostRecentVehicleIndex = 0;
    let mostRecentIndexes = [indexes[0]];
    let badIndexes: number[] = [];

    // Loop over all the indexes for the duplicate vehicles and determine which data is the most recent.
    indexes.forEach((vehicleIndex, i) => {
      if (i === 0) {
        return;
      }

      const mostRecentTime = DateTime.fromFormat(
        vehicles[indexes[mostRecentVehicleIndex]].last_message,
        'M/d/yyyy h:mm:ss a'
      );

      const time = DateTime.fromFormat(
        vehicles[vehicleIndex].last_message,
        'M/d/yyyy h:mm:ss a'
      );

      if (mostRecentTime.equals(time)) {
        mostRecentIndexes.push(vehicleIndex);
      } else if (time > mostRecentTime) {
        mostRecentVehicleIndex = i;
        badIndexes = mostRecentIndexes;
        mostRecentIndexes = [vehicleIndex];
      } else {
        badIndexes.push(vehicleIndex);
        return;
      }
    });

    // Mark older timestamps for deletion. If multiple objects with the same timestamp, then append all the trip IDs
    // into one, store that in the first found object, and mark the other objects for deletion.
    if (mostRecentIndexes.length > 1) {
      // Remove buses that have the same time, but store their trip IDs.
      const trips = mostRecentIndexes
        .map((index) => vehicles[index].trip)
        .join(', ');

      cleanVehicles[mostRecentIndexes[0]].trip = trips;

      // Mark the other objects for deletion.
      for (let i = 1; i < mostRecentIndexes.length; i++) {
        indexesToRemove.push(mostRecentIndexes[i]);
      }
    }

    // Mark older timestamps for deletion.
    badIndexes && indexesToRemove.push(...badIndexes);
  });

  // Remove all the indexes that are bad and return
  return cleanVehicles.filter((_, index) => !indexesToRemove.includes(index));
};

export const fetchAndEtlData = async (): Promise<BULL_JOB_RESULT> => {
  const startTime = performance.now();
  const redis = new Redis(`${process.env.BULL_HOST}:${process.env.BULL_PORT}`);
  const publishChannel =
    process.env.REDIS_VEHICLE_PUBLISH_CHANNEL || 'vehicleUpsert';
  let response: BULL_JOB_RESULT = {
    status: 'failed',
    message: 'Initialization',
  };

  try {
    const dirtyXml = await fetchVehicleDataAsXml();
    const xml = cleanBusXml(dirtyXml);
    const dirtyJson = await parseXmlToJson(xml);

    // Check if JSON has error message, and throw error if so.
    if ('errormessage' in dirtyJson) {
      throw new Error('API threw an error: ' + dirtyJson.errormessage);
    }

    // If vehicle not in JSON, then it's an invalid format retrieved from the API.
    if (!('vehicle' in dirtyJson)) {
      throw new Error('Invalid API format, vehicle not found');
    }

    const json = cleanDuplicateBusNumbers(dirtyJson.vehicle as VehicleApi[]);

    const vehicleEntities = transformToVehicleEntities(json);
    const insertResult = await saveVehicleEntities(vehicleEntities);

    redis.publish(publishChannel, JSON.stringify({ data: insertResult.raw }));

    response = {
      ...response,
      status: 'success',
      message: `${insertResult.raw.length} successful upserts`,
    };
  } catch (err) {
    let errorMessage = '';
    if (err instanceof Error) {
      console.error('Stack Trace:', err.stack);
      errorMessage = err.message;
    } else {
      errorMessage = String(err);
    }

    response = {
      ...response,
      status: 'failed',
      message: `Error: ${errorMessage}`,
    };
  }

  return {
    ...response,
    duration: `${((performance.now() - startTime) / 1000).toFixed(3)} seconds`,
  };
};
