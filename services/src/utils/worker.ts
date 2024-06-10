import { Job, Worker } from 'bullmq';
import { fetchAndEtlData } from '@jobs/busApiFetch';
import { BULL_JOB_RESULT } from './types';

let worker;
const processJob = async (job: Job): Promise<BULL_JOB_RESULT> => {
  try {
    let jobResult;

    console.log(`[#${job.id}] Processing job ${job.name}`);

    if (job.name === 'fetch-vehicles') {
      jobResult = await fetchAndEtlData();
    } else {
      throw new Error(`Unknown job name: ${job.name}`);
    }

    if (!jobResult) {
      throw new Error('BULL_JOB_RESULT not returned.');
    }

    return jobResult;
  } catch (err) {
    console.error(`Error processing job ${job.id}: `, err);
    throw err;
  }
};

const queueName = process.env.BULL_QUEUE_NAME;
const host = process.env.BULL_HOST;
const port = process.env.BULL_PORT;

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

if (!port) {
  throw new Error(
    `Worker Init Error. BULL_PORT is not defined in the environment variables`
  );
}

const portNumber = Number(port);

if (isNaN(portNumber)) {
  throw new Error(
    'Worker Init Error. BULL_PORT envrionment variable is not a real number'
  );
}

try {
  console.log(`Creating worker (${queueName})`);

  worker = new Worker(queueName, processJob, {
    connection: {
      host,
      port: portNumber,
    },
  });
} catch (err) {
  console.error('Worker Init Error: ', worker);
  process.exit(1);
}

worker.on('completed', (job, result) => {
  console.log(`[#${job.id}] Completed. Results:`, result);
});

worker.on('failed', (job, err) => {
  console.error(`[$${job?.id}] Failed. Error: ${err.message}`);
});

worker.on('ready', () => {
  console.log('Worker is ready.');
});
