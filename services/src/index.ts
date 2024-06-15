import { addJob, clearJob } from '@utils/bullmq';
import '@utils/worker';
import { AppDataSource } from '@typeorm/typeorm';
import { JobsOptions } from 'bullmq';
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

  const jobName = 'fetch-vehicles';
  const jobOptions: JobsOptions = {
    repeat: {
      every: 10 * 1000, // 30 seconds in milliseconds.
    },
  };
  await clearJob(jobName, jobOptions);
  await addJob(
    jobName,
    {},
    { ...jobOptions, jobId: 'fetch-vehicles-repeating' }
  );

  await addJob('fetch-vehicles');
})();
