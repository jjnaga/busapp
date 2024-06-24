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
