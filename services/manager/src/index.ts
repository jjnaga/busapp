import { addJob, clearJob, createQueue } from './utils/bullmq';
import { JobsOptions } from 'bullmq';

const loadRecurringJob = async (jobName: string, jobOptions: JobsOptions) => {
  // Clear any exisiting jobs.
  await clearJob(jobName, jobOptions);
  // Add reoccurring job
  await addJob(jobName, {}, { ...jobOptions, jobId: `${jobName}-repeating` });

  // Initial run of job.
  await addJob(jobName);
};

const main = () => {
  const queueName = process.env.BULL_QUEUE_NAME;
  const host = process.env.BULL_HOST;
  const port = process.env.BULL_PORT;
  const jobBusApiEtl = process.env.BULL_JOB_BUS_API_ETL;

  if (!queueName) {
    throw new Error(
      `Queue Init Error. BULL_QUEUE_NAME is not defined in the environment variables`
    );
  }

  if (!jobBusApiEtl) {
    throw new Error(
      `Queue Init Error. BULL_JOB_BUS_API_ETL is not defined in the environment variables`
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

  // Create bullmq queue.
  createQueue(queueName, host, port);

  // Load all jobs.
  loadRecurringJob(jobBusApiEtl, {
    repeat: {
      every: 10 * 1000,
    },
  });
};

main();
