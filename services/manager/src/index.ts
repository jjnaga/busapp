import redisClient from '@utils/redisClient';

const REDIS_JOB_API_NAME = process.env.REDIS_JOB_API_NAME;
const REDIS_JOB_GTFS_NAME = process.env.REDIS_JOB_GTFS_NAME;
const REDIS_JOBS_MAX_LENGTH = process.env.REDIS_JOBS_MAX_LENGTH;
const REDIS_STREAM_API_NAME = process.env.REDIS_STREAM_API_NAME;
const REDIS_STREAM_GTFS_NAME = process.env.REDIS_STREAM_GTFS_NAME;
let shutdown = false;

if (
  !REDIS_JOB_API_NAME ||
  !REDIS_JOB_GTFS_NAME ||
  !REDIS_JOBS_MAX_LENGTH ||
  !REDIS_STREAM_API_NAME ||
  !REDIS_STREAM_GTFS_NAME
) {
  throw new Error(`Init Error. A environment variable not defined.`);
}

const setupShutdownHandlers = () => {
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Starting graceful shutdown.');
    shutdown = true;
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT. Starting graceful shutdown.');
    shutdown = true;
  });
};

const addJob = async (streamName: string, jobType: string) => {
  console.log(`[${streamName}] Adding job '${jobType}'`);

  await redisClient.xadd(
    streamName,
    'MAXLEN',
    '~',
    REDIS_JOBS_MAX_LENGTH,
    '*',
    'jobType',
    jobType
  );
};

const loadRecurringJob = async (
  streamName: string,
  jobName: string,
  interval: number
) => {
  console.log(`Creating recurring job '${jobName}' with interval ${interval}`);
  addJob(streamName, jobName);
  return setInterval(async () => {
    await addJob(streamName, jobName);
  }, interval);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  setupShutdownHandlers();

  // Load all jobs.
  let interval1 = await loadRecurringJob(
    REDIS_STREAM_API_NAME,
    REDIS_JOB_API_NAME,
    5000
  );

  let interval2 = await loadRecurringJob(
    REDIS_STREAM_GTFS_NAME,
    REDIS_JOB_GTFS_NAME,
    3600000
  );

  // Listen for shutdown and close connections.
  while (!shutdown) {
    await sleep(1000);
  }

  // Shutdown
  console.log('Shutting Down: Ending intervals');
  clearInterval(interval1);
  clearInterval(interval2);
  console.log('Shutting Down: Closing Redis connection');
  redisClient.disconnect();

  console.log('Shutting Down: bye');
};

main().catch(console.error);
