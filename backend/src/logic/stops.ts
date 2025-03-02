import { AppDataSource } from '@typeorm/typeorm';
import { Stops } from '@typeorm/entities/Stops';
import { BoundingBox } from '@utils/types';
import { Between } from 'typeorm';

export const fetchAllStops = async () => {
  try {
    const stopsRepo = AppDataSource.getRepository(Stops);

    const stops = await stopsRepo.find();

    return stops;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};

export const fetchStopsInBoundingBox = async ({ topLeft, bottomRight }: BoundingBox) => {
  try {
    const stopsRepo = AppDataSource.getRepository(Stops);

    const stops = await stopsRepo.findBy({
      stopLat: Between(bottomRight.y, topLeft.y),
      stopLon: Between(topLeft.x, bottomRight.x),
    });

    return stops;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};

export const fetchSingleStop = async (stopNumber: string) => {
  const STOP_URL = (stopNumber: string) =>
    `http://api.thebus.org/arrivalsJSON/?key=${process.env.API_KEY}&stop=${stopNumber}`;
  try {
    const response = await fetch(STOP_URL(stopNumber));
    const json = await response.json();
    return json;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};
