import { getPendingNotifications } from './getPendingNotifications';
import redisClient from './redisClient';

export const addJob = async (
  streamName: string,
  jobType: string,
  data?: Record<string, any> | string
) => {
  console.log(`[${streamName}] Adding job '${jobType}'`);
  const args = ['*', 'jobType'];

  if (data) {
    typeof data === 'string'
      ? args.push('data', data)
      : args.push('data', JSON.stringify(data));
  }

  await redisClient.xadd(streamName, '*', 'jobType', jobType);
};

export const loadRecurringJob = async (
  streamName: string,
  jobName: string,
  interval: number
) => {
  addJob(streamName, jobName);
  return setInterval(async () => {
    await addJob(streamName, jobName);
  }, interval);
};

export const startNotificationJob = async (streamName: string) => {
  const notificationJob = async () => {
    const pendingNotications = await getPendingNotifications();

    for (let pendingNotification of pendingNotications) {
      await addJob(streamName, JSON.stringify(pendingNotification));
    }
  };

  notificationJob();
  // if (process.env.NODE_ENV === 'development') {
  //   notificationJob();
  //   notificationJob();
  // }

  const interval = setInterval(notificationJob, 60000);

  return interval;
};
