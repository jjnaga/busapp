import { Job, Worker } from 'bullmq';
import { fetchAndEtlData } from './busApiEtl';
import { BULL_JOB_RESULT } from '@utils/types';

let worker;
const queueName = process.env.BULL_QUEUE_NAME;
const host = process.env.BULL_HOST;
const port = Number(process.env.BULL_PORT);
const jobName = process.env.WORKER_JOB_NAME;

const processJob = async (job: Job): Promise<BULL_JOB_RESULT | null> => {
  try {
    if (job.name !== jobName) {
      return null;
    }

    console.log(`[#${job.id}] Processing job ${job.name}`);
    return await fetchAndEtlData();
  } catch (err) {
    console.error(`Error processing job ${job.id}: `, err);
    throw err;
  }
};

try {
  // Validate environment variables
  if (!queueName) {
    throw new Error(
      `Worker Init Error. BULL_QUEUE_NAME is not defined in the environment variables`
    );
  }

  if (!host) {
    throw new Error(
      `Worker Init Error. BULL_HOST is not defined in the environment variables`
    );
  }

  if (!jobName) {
    throw new Error(
      `Worker Init Error. WORKER_JOB_NAME is not defined in the environment variables`
    );
  }

  if (!port) {
    throw new Error(
      `Worker Init Error. BULL_PORT is not defined in the environment variables`
    );
  }

  if (isNaN(port)) {
    throw new Error(
      'Worker Init Error. BULL_PORT envrionment variable is not a real number'
    );
  }

  worker = new Worker(queueName, processJob, {
    connection: {
      host,
      port: port,
    },
  });

  console.log(
    `Worker created for queue (${queueName}). Handles jobs: ${jobName}`
  );
} catch (err) {
  console.error('Worker Init Error: ', err);
  process.exit(1);
}

worker.on('completed', (job, result) => {
  if (result === null) {
    console.log(`[#${job.id}] Skipped, not our job.`);
  } else {
    console.log(`[#${job.id}] Completed. Results:`, result);
  }
});

worker.on('failed', (job, err) => {
  console.error(`[$${job?.id}] Failed. Error: ${err.message}`);
});

worker.on('ready', () => {
  console.log('Worker is ready.');
});
