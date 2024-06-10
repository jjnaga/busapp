import { addJob } from '@utils/bullmq';
import '@utils/worker';
import { AppDataSource } from '@typeorm/typeorm';
// import { Queue } from 'bullmq';
// hehea

(async () => {
  // const queue = new Queue('fetch-vehicles-queue', {
  //   connection: {
  //     host: process.env.REDIS_HOST,
  //     port: Number(process.env.REDIS_PORT),
  //   },
  // });

  try {
    console.log('Connecting to PG via TypeORM');
    await AppDataSource.initialize();
    console.log('Connected.');
  } catch (err) {
    console.error('Error initializing TypeORM: ', err);
  }

  await addJob(
    'fetch-vehicles',
    {},
    {
      repeat: {
        every: 30 * 1000, // 30 seconds in milliseconds.
      },
    }
  );
})();
