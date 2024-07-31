// import { fetchAndEtlData } from './busApiEtl';
const os = require('os');
import redisClient from '@utils/redisClient';
import { AppDataSource } from '@utils/typeorm/typeorm';
import { processNotification } from './utils/processNotification';
import { Notification } from '@utils/typeorm/entities/Notification';
import webPush from 'web-push';
import { toUrlSafeBase64 } from '@utils/utils';

// Environment Variables
const REDIS_STREAM_NAME = process.env.REDIS_STREAM_NAME!;
const REDIS_CONSUMER_GROUP_NAME = process.env.REDIS_CONSUMER_GROUP_NAME!;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL = process.env.VAPID_EMAIL!;

const workerId = os.hostname();
let shutdown = false;

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
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
    'VAPID_EMAIL',
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

  // Initialize webpush
  // Set VAPID details
  // Validate environment variables.
  validateEnv();

  // Setup signal handlers
  setupShutdownHandlers();

  // Setup VAPID
  webPush.setVapidDetails(
    VAPID_EMAIL,
    // toUrlSafeBase64(VAPID_PUBLIC_KEY)!,
    VAPID_PUBLIC_KEY!,
    VAPID_PRIVATE_KEY!
  );

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
        const [[, messages]] = results;
        for (const [messageId, messageData] of messages) {
          const [_, message] = messageData;
          const notification: Notification = JSON.parse(message);

          // Process Notification
          const results: webPush.SendResult = await processNotification(
            notification
          );

          // Check if notification posted OK
          if (results.statusCode !== 201)
            throw new Error(
              `Web Push Failed: ${results.statusCode} ${
                results.body && '- Body: ' + results.body
              }`
            );

          // Update notification row;
          const notificationRepo = AppDataSource.getRepository(Notification);
          const result = await notificationRepo.update(notification.id, {
            notificationSent: new Date(),
          });

          if (!result.affected || result.affected <= 0)
            throw new Error(`Notification row ${notification.id} not updated`);

          // Ack job
          await redisClient.xack(
            REDIS_STREAM_NAME,
            REDIS_CONSUMER_GROUP_NAME,
            messageId
          );

          console.log(
            `[${workerId}] ${messageId}: Done. Results: ${JSON.stringify(
              results
            )}`
          );
        }
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
