import { AppDataSource } from '@typeorm/typeorm';
import { Vehicle } from '@typeorm/entities/Vehicle';

export const fetchAllVehicles = async () => {
  try {
    const vehicleRepo = AppDataSource.getRepository(Vehicle);
    const vehicles = await vehicleRepo.find();
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
