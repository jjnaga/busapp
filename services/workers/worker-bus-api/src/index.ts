import redisClient from '@utils/redisClient';
const os = require('os');
import { fetchAndEtlData } from './busApiEtl';
import { AppDataSource } from '@utils/typeorm/typeorm';

// Environment Variables
const REDIS_STREAM_NAME = process.env.REDIS_STREAM_NAME;
const REDIS_CONSUMER_GROUP_NAME = process.env.REDIS_CONSUMER_GROUP_NAME;
const REDIS_JOB_NAME = process.env.REDIS_JOB_NAME;
const workerId = os.hostname();
let shutdown = false;

if (!REDIS_STREAM_NAME || !REDIS_CONSUMER_GROUP_NAME || !REDIS_JOB_NAME) {
  throw new Error(`Init Error. Missing environment variables.`);
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

const validateEnv = () => {
  const requiredEnvVars = [
    'API_KEY',
    'DB_DATABASE',
    'DB_HOST',
    'DB_PASSWORD',
    'DB_PORT',
    'DB_SCHEMA',
    'DB_USERNAME',
    'REDIS_CONSUMER_GROUP_NAME',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_STREAM_NAME',
    'REDIS_VEHICLE_PUBLISH_CHANNEL',
  ];

  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      throw new Error(`Environment variable ${varName} is not set`);
    }
  });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const worker = async () => {
  console.log('Starting worker.');

  // Validate environment variables.
  validateEnv();

  // Setup signal handlers
  setupShutdownHandlers();

  // Initialize TypeORM
  await AppDataSource.initialize();

  // Create consumer group
  try {
    await redisClient.xgroup(
      'CREATE',
      REDIS_STREAM_NAME,
      REDIS_CONSUMER_GROUP_NAME,
      '$',
      'MKSTREAM'
    );
  } catch (err) {
    // Ignore error if group already exists
  }

  while (!shutdown) {
    try {
      const results = await redisClient.xreadgroup(
        'GROUP',
        REDIS_CONSUMER_GROUP_NAME,
        workerId,
        'COUNT',
        1,
        'BLOCK',
        2500,
        'STREAMS',
        REDIS_STREAM_NAME,
        '>'
      );

      if (results && results.length > 0) {
        // @ts-ignore yea its not obvious to me how to set the types on this.
        const [[_, messages]] = results;
        const [messageId] = messages[0];

        await redisClient.xack(
          REDIS_STREAM_NAME,
          REDIS_CONSUMER_GROUP_NAME,
          messageId
        );

        console.log(`[${workerId}] ${messageId}: Starting job`);

        const jobResult = await fetchAndEtlData();

        console.log(
          `[${workerId}] ${messageId}: Done. Results: ${JSON.stringify(
            jobResult
          )}`
        );
      }
    } catch (err) {
      console.error('Error processing message: ', err);
      if (!shutdown) await sleep(1000);
    }
  }

  console.log('Shutting Down: Quitting redis.');
  redisClient.disconnect();
  console.log('Shutting Down: bye');
};

worker().catch(console.error);
