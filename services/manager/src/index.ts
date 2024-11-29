// 11/28/24 JJN
// the notification job took down the whole process. that is definetly
// a bad implementation of this worker/manager setup... who DID THIS
import { loadRecurringJob, startNotificationJob } from '@utils/jobs';
import redisClient from '@utils/redisClient';
import { AppDataSource } from '@utils/typeorm/typeorm';

const REDIS_JOB_API_NAME = process.env.REDIS_JOB_API_NAME;
const REDIS_JOB_GTFS_NAME = process.env.REDIS_JOB_GTFS_NAME;
const REDIS_JOBS_MAX_LENGTH = process.env.REDIS_JOBS_MAX_LENGTH;
const REDIS_STREAM_API_NAME = process.env.REDIS_STREAM_API_NAME;
const REDIS_STREAM_GTFS_NAME = process.env.REDIS_STREAM_GTFS_NAME;
const REDIS_STREAM_NOTIFICATION_NAME =
  process.env.REDIS_STREAM_NOTIFICATION_NAME;

let shutdown = false;

if (
  !REDIS_JOB_API_NAME ||
  !REDIS_JOB_GTFS_NAME ||
  !REDIS_JOBS_MAX_LENGTH ||
  !REDIS_STREAM_API_NAME ||
  !REDIS_STREAM_GTFS_NAME ||
  !REDIS_STREAM_NOTIFICATION_NAME
) {
  throw new Error(`Init Error. A environment variable not defined.`);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  let intervals: NodeJS.Timeout[] = [];
  await AppDataSource.initialize();

  // Setup shutdown handlers.
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Starting graceful shutdown.');
    shutdown = true;
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT. Starting graceful shutdown.');
    shutdown = true;
  });

  // Load all jobs.
  if (process.env.NODE_ENV === 'development') {
    console.log('in dev');
    intervals.push(
      await loadRecurringJob(REDIS_STREAM_API_NAME, REDIS_JOB_API_NAME, 25000)
    );
  } else {
    intervals.push(
      await loadRecurringJob(REDIS_STREAM_API_NAME, REDIS_JOB_API_NAME, 2000)
    );
  }

  intervals.push(
    await loadRecurringJob(REDIS_STREAM_GTFS_NAME, REDIS_JOB_GTFS_NAME, 3600000)
  );

  // intervals.push(await startNotificationJob(REDIS_STREAM_NOTIFICATION_NAME));

  // Listen for shutdown and close connections.
  while (!shutdown) {
    await sleep(1000);
  }

  // Shutdown
  console.log('Shutting Down: Ending intervals');
  for (let interval of intervals) {
    clearInterval(interval);
  }

  console.log('Shutting Down: Closing Redis connection');
  await redisClient.disconnect();
  await AppDataSource.destroy();

  console.log('Shutting Down: bye');
};

main().catch(console.error);
