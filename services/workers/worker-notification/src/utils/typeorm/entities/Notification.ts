import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

enum DayOfWeek {
  Sunday = 'Sunday',
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
}

type NotificationDataType = 'stop' | 'bus';
interface NotificationData {
  type: NotificationDataType;
  stopId?: string;
  busId?: string;
}

@Index('notification_pkey', ['id'], { unique: true })
@Entity('notification', { schema: 'thebus' })
export class Notification {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column('boolean', { name: 'notification_sent', nullable: true })
  notificationSent: Date;

  @Column('json', { name: 'subscription' })
  subscription: object;

  @Column('json', { name: 'notification_data' })
  notificationData: NotificationData;

  @Column('timestamp with time zone', {
    name: 'notification_date',
  })
  notificationDate: Date;

  @Column('enum', { enum: DayOfWeek, name: 'frequency', nullable: true })
  dayOfWeek: DayOfWeek | null;
}
