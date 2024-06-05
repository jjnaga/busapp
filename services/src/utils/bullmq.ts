import { Queue } from 'bullmq';

let dataQueue: Queue;

const queueName = process.env.BULL_QUEUE_NAME;
const host = process.env.BULL_HOST;
const port = process.env.BULL_PORT;

if (!queueName) {
  throw new Error(
    `Queue Init Error. BULL_QUEUE_NAME is not defined in the environment variables`
  );
}

if (!host) {
  throw new Error(
    `Queue Init Error. BULL_HOST is not defined in the environment variables`
  );
}

if (!port) {
  throw new Error(
    `Queue Init Error. BULL_PORT is not defined in the environment variables`
  );
}

try {
  console.log(`Creating queue (${queueName}) at ${host}:${port}`);
  dataQueue = new Queue(queueName, {
    connection: {
      host: '127.0.0.1',
      port: 6379,
    },
  });

  console.log('Queue created');
} catch (err) {
  console.error('Unable to create queue.');
  process.exit(1);
}

export const addJob = async (jobName: string, jobData: object = {}) => {
  console.log(`Adding job '${jobName}'.`);

  try {
    await dataQueue.add(jobName, jobData);
  } catch (err) {
    console.error('Unable to add job to the queue: ', err);
  }
};
