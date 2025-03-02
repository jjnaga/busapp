import { AppDataSource } from '@typeorm/typeorm';
import { Vehicle } from '@typeorm/entities/Vehicle';
import { IsNull, MoreThanOrEqual, Not } from 'typeorm';
import { VehicleWithShape } from '@utils/types';

export const fetchAllVehiclesWithShapes = async () => {
  try {
    // Calculate the time threshold for recent vehicles
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Execute the raw SQL query with a parameter for recent vehicles
    const rawResults = await AppDataSource.query(
      `
      SELECT
        v.*,
        s.*
      FROM
        thebus.vehicle v
      INNER JOIN gtfs.trips t ON 
        v.trip_id = t.trip_id
      INNER JOIN gtfs.shapes s ON
        t.shape_id = s.shape_id
      WHERE
        v.trip_id IS NOT NULL
        AND v.heartbeat >= $1
      ORDER BY
        v.trip_id,
        s.shape_pt_sequence
    `,
      [twentyFourHoursAgo.toISOString()]
    );

    // Group the results by vehicle
    const vehicleMap = new Map<string, VehicleWithShape>();

    // @ts-expect-error idk play raw sql wont have type but we know the shape the play looks like zod
    // here but thats dumb tbh maybe this is 2025 asm 🤭
    rawResults.forEach((row) => {
      const busNumber = row.bus_number;

      if (!vehicleMap.has(busNumber)) {
        // Create a new vehicle entry
        vehicleMap.set(busNumber, {
          busNumber: row.bus_number,
          tripId: row.trip_id,
          driver: row.driver,
          latitude: row.latitude,
          longitude: row.longitude,
          adherence: row.adherence,
          heartbeat: row.heartbeat,
          routeName: row.route_name,
          headsign: row.headsign,
          shapePoints: [],
        } as VehicleWithShape);
      }

      // Add shape point to existing vehicle
      vehicleMap.get(busNumber)!.shapePoints.push({
        shapeId: row.shape_id,
        shapePtLat: row.shape_pt_lat,
        shapePtLon: row.shape_pt_lon,
        shapePtSequence: row.shape_pt_sequence,
      });
    });

    // Convert map to array
    return Array.from(vehicleMap.values());
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};

export const fetchAllVehicles = async () => {
  try {
    const vehicleRepo = AppDataSource.getRepository(Vehicle);
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const vehicles = await vehicleRepo.findBy({
      tripId: Not(IsNull()),
      heartbeat: MoreThanOrEqual(twentyFourHoursAgo),
    });

    return vehicles;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};

export const fetchTripShape = async (vehicleNumber: string) => {
  try {
    // Execute the raw SQL query with a parameter for vehicle
    const rawResults = await AppDataSource.query(
      `
      SELECT
        v.trip_id,
        s.shape_id,
        s.shape_pt_lat,
        s.shape_pt_lon,
        s.shape_pt_sequence
      FROM
        thebus.vehicle v
      INNER JOIN gtfs.trips t ON 
        v.trip_id = t.trip_id
      INNER JOIN gtfs.shapes s ON
        t.shape_id = s.shape_id
      WHERE
        v.trip_id IS NOT NULL
        AND v.bus_number = $1
      ORDER BY
        s.shape_pt_sequence
      `,
      [vehicleNumber]
    );

    if (!rawResults || rawResults.length === 0) {
      throw new Error(`No shape data found for vehicle ${vehicleNumber}`);
    }

    // Extract tripId from first record
    const tripId = rawResults[0].trip_id;

    // Map raw results to shape points array
    // @ts-expect-error idk play raw sql wont have type but we know the shape the play looks like zod
    const shapes = rawResults.map((row) => ({
      shapeId: row.shape_id,
      lat: row.shape_pt_lat,
      lon: row.shape_pt_lon,
      sequence: row.shape_pt_sequence,
    }));

    // Return structured response with tripId and shapes array
    return {
      tripId,
      shapes,
    };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};

export const fetchOneVehicle = async (vehicleNumber: string) => {
  try {
    const vehicleRepo = AppDataSource.getRepository(Vehicle);
    const vehicles = await vehicleRepo.findOneByOrFail({ busNumber: vehicleNumber });
    return vehicles;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};
