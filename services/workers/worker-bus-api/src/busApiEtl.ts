import { Vehicle } from '@utils/typeorm/entities/Vehicle';
import { AppDataSource } from '@utils/typeorm/typeorm';
import { JOB_RESULT, VehicleApi } from '@utils/types';
import { parseStringPromise } from 'xml2js';
import { DateTime } from 'luxon';
import { InsertResult } from 'typeorm';
import redisClient from '@utils/redisClient';

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
  // Track problematic trip IDs for reporting
  const multiTripIds: Record<string, string> = {};

  return vehicles.map((data) => {
    // Parse date with validation
    const parsedDate = DateTime.fromFormat(
      data.last_message,
      'M/d/yyyy h:mm:ss a',
      { zone: 'Pacific/Honolulu' }
    );

    const heartbeat = parsedDate.isValid ? parsedDate.toJSDate() : new Date();

    // Process tripId - handle the three possible states:
    // 1. Regular numeric ID (most common)
    // 2. "null_trip" literal string (means null)
    // 3. Multiple IDs separated by commas (e.g. "12345,67890")
    let tripId: number | null = null;

    if (data.trip) {
      if (data.trip === 'null_trip') {
        // Case: explicit null trip
        tripId = null;
      } else if (data.trip.includes(',')) {
        // Case: multiple trip IDs (comma separated)
        const firstTripId = data.trip.split(',')[0].trim();

        // Log for monitoring and debugging
        multiTripIds[data.number] = data.trip;
        console.warn(
          `Bus ${data.number} has multiple trips: ${data.trip} - using first ID: ${firstTripId}`
        );

        // Convert first ID to number (or null if not valid)
        tripId = /^\d+$/.test(firstTripId) ? Number(firstTripId) : null;
      } else if (/^\d+$/.test(data.trip)) {
        // Case: clean numeric ID (most common)
        tripId = Number(data.trip);
      } else {
        // Case: unexpected format
        console.error(
          `Unexpected tripId format for bus ${data.number}: ${data.trip}`
        );
        tripId = null;
      }
    }

    return new Vehicle({
      busNumber: data.number,
      tripId: tripId,
      driver: data.driver,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      adherence: Number(data.adherence),
      heartbeat: heartbeat, // Use the validated date
      routeName: data.route_short_name,
      headsign: data.headsign,
    });
  });
};

const saveVehicleEntities = async (
  entities: Vehicle[]
): Promise<InsertResult> => {
  try {
    const vehicleRepository = AppDataSource.getRepository(Vehicle);

    return vehicleRepository
      .createQueryBuilder()
      .insert()
      .into('thebus.vehicle')
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
        ['bus_number'],
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

export const fetchAndEtlData = async (): Promise<JOB_RESULT> => {
  const startTime = performance.now();
  const publishChannel =
    process.env.REDIS_VEHICLE_PUBLISH_CHANNEL || 'vehicleUpsert';
  let response: JOB_RESULT = {
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

    redisClient.publish(
      publishChannel,
      JSON.stringify({
        type: 'vehicleUpdate',
        notes: 'return data from typeORM upsert on Vehicle table',
        data: insertResult.raw,
      })
    );

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
