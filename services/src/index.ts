import { config } from 'dotenv';
config();
import { addJob } from '@utils/bullmq';
import { AppDataSource } from '@typeorm/typeorm';
import { User } from '@typeorm/entities/User';

(async () => {
  try {
    console.log('Connecting to PG via TypeORM');
    const dataSource = await AppDataSource.initialize();
    console.log('Connected.');
  } catch (err) {}

  addJob('fetch-vehicles');
})();
