import redisClient from '@utils/redisClient';

const REDIS_STREAM_NAME = process.env.REDIS_STREAM_NAME;
const REDIS_CONSUMER_GROUPS = process.env.REDIS_CONSUMER_GROUPS;
const REDIS_JOB_API = process.env.REDIS_JOB_API;
const REDIS_JOB_GTFS = process.env.REDIS_JOB_GTFS;

if (!REDIS_STREAM_NAME) {
  throw new Error(
    `Init Error. REDIS_STREAM_NAME is not defined as an environment variable`
  );
}

if (!REDIS_CONSUMER_GROUPS) {
  throw new Error(
    `Init Error. REDIS_JOB_BUS_API_ETL is not defined as an environment variable`
  );
}

if (!REDIS_JOB_API) {
  throw new Error(
    `Init Error. REDIS_JOB_API is not defined as an environment variable`
  );
}

const addJob = async (jobName: string, jobData: any = {}) => {
  const jobId = `${Date.now()}`;

  console.log(`[${REDIS_STREAM_NAME}] Adding job. ID: ${jobId}`);

  await redisClient.xadd(
    REDIS_STREAM_NAME,
    '*',
    'jobName',
    jobName,
    'jobData',
    JSON.stringify(jobData),
    'jobId',
    jobId
  );
  return jobId;
};

const loadRecurringJob = async (
  jobName: string,
  jobData: any = {},
  interval: number
) => {
  console.log(`Creating recurring job '${jobName}' with interval ${interval}`);
  setInterval(async () => {
    await addJob(jobName, jobData);
  }, interval);
};

const main = async () => {
  for (const consumerGroup of REDIS_CONSUMER_GROUPS.split(',')) {
    console.log('Creating consumer group: ', consumerGroup);
    // Create consumer group
    try {
      await redisClient.xgroup(
        'CREATE',
        REDIS_STREAM_NAME,
        consumerGroup,
        '0',
        'MKSTREAM'
      );
    } catch (err) {} // Error thrown if group exists. Ignore error.
  }

  // Load all jobs.
  loadRecurringJob(REDIS_JOB_API, {}, 10000);
};

main().catch(console.error);
