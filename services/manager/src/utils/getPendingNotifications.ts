import { IsNull, LessThan } from 'typeorm';
import { Notification } from './typeorm/entities/Notification';
import { AppDataSource } from './typeorm/typeorm';

export const getPendingNotifications = async () => {
  const notificationRepo = AppDataSource.getRepository(Notification);

  // Add a minute for any upstream delays.
  const oneMinuteAgo = new Date(Date.now() - 60000);

  const pendingNotifications = await notificationRepo.find({
    where: {
      notificationSent: IsNull(),
      notificationDate: LessThan(oneMinuteAgo),
    },
  });
  console.log('huh', pendingNotifications);

  return pendingNotifications;
};
