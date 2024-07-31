import { getStopData } from '@utils/getStopData';
import { Notification } from '@utils/typeorm/entities/Notification';
import webPush from 'web-push';
import { Arrivals } from './types';

export const processNotification = async (
  notification: Notification
): Promise<webPush.SendResult> => {
  const { subscription, notificationData } = notification;
  const { type, busId, stopId } = notificationData;

  let data: Arrivals;
  let payload = {
    title: 'Bus Arrivals',
    body: '',
    icon: '/assets/icons/bus-icon.png',
  };

  if (type === 'stop') {
    if (!stopId || stopId === '') throw new Error('Stop ID is not defined');
    data = (await getStopData(stopId)) as Arrivals;

    let { arrivals } = data;

    let result: string = `First ${Math.min(3, arrivals.length)}\n`;
    for (let i = 0; i < Math.min(3, arrivals.length); i++) {
      result += `${arrivals[i].headsign} - ${arrivals[i].stopTime}\n`;
    }

    payload.body = result;
  }

  return webPush.sendNotification(
    subscription as webPush.PushSubscription,
    JSON.stringify(payload)
  );
};
