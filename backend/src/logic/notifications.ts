import { AppDataSource } from '@typeorm/typeorm';
import { Stops } from '@typeorm/entities/Stops';
import { BoundingBox } from '@utils/types';
import { Between } from 'typeorm';
import { Subscription } from '@typeorm/entities/Subscription';
import { Notification } from '@typeorm/entities/Notification';

// @ts-expect-error i just wanna finish mbmb
export const addRequest = async (notificationData: Parital<Notification>) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);

    const notification = await notificationRepo.create(notificationData);
    const savedNotification = await notificationRepo.save(notification);

    return savedNotification;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};

export const addSubscription = async (subscription: object) => {
  try {
    const subscriptionsRepo = AppDataSource.getRepository(Subscription);

    const newSubscription = new Subscription();
    newSubscription.subscription = subscription;

    await subscriptionsRepo.save(newSubscription);
    return newSubscription.id;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};

// export const fetchStopsInBoundingBox = async ({ topLeft, bottomRight }: BoundingBox) => {
//   try {
//     const stopsRepo = AppDataSource.getRepository(Subscriptions);

//     const stops = await stopsRepo.findBy({
//       stopLat: Between(bottomRight.y, topLeft.y),
//       stopLon: Between(topLeft.x, bottomRight.x),
//     });

//     return stops;
//   } catch (err) {
//     throw new Error(err instanceof Error ? err.message : String(err));
//   }
// };
