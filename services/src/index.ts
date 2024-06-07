import { config } from 'dotenv';
config();
import { addJob } from '@utils/bullmq';
import '@utils/worker';
import { AppDataSource } from '@typeorm/typeorm';

(async () => {
  try {
    console.log('Connecting to PG via TypeORM');
    await AppDataSource.initialize();
    console.log('Connected.');
  } catch (err) {
    console.error('Error initializing TypeORM: ', err);
  }

  addJob('fetch-vehicles');
})();
