import { AppDataSource } from '@typeorm/typeorm';
import { Vehicle } from '@typeorm/entities/Vehicle';
import { IsNull, MoreThanOrEqual, Not } from 'typeorm';

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

export const fetchOneVehicle = async (vehicleNumber: string) => {
  try {
    const vehicleRepo = AppDataSource.getRepository(Vehicle);
    const vehicles = await vehicleRepo.findOneByOrFail({ busNumber: vehicleNumber });
    return vehicles;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};
