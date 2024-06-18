import { JobsOptions, Queue } from 'bullmq';

let dataQueue: Queue;

export const createQueue = async (
  queueName: string,
  host: string,
  port: string
) => {
  try {
    console.log(`Creating queue (${queueName}) at ${host}:${port}`);
    dataQueue = new Queue(queueName, {
      connection: {
        host: process.env.BULL_HOST,
        port: Number(process.env.BULL_PORT),
      },
    });

    console.log('Queue created');
  } catch (err) {
    console.error('Unable to create queue.');
    process.exit(1);
  }
};

export const clearJob = async (jobName: string, options: JobsOptions = {}) => {
  await dataQueue.removeRepeatable(jobName, options);
};

export const addJob = async (
  jobName: string,
  jobData: object = {},
  options: JobsOptions = {}
) => {
  console.log(`Adding job '${jobName}'. Options: `, options);

  try {
    await dataQueue.add(jobName, jobData, options);
    console.log(`Adding job '${jobName}': Added `);
  } catch (err) {
    console.error('Unable to add job to the queue: ', err);
  }
};
