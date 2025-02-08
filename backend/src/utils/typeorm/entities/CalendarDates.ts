import { Column, Entity, Index } from 'typeorm';

@Index('calendar_dates_pkey', ['date', 'serviceId'], { unique: true })
@Entity('calendar_dates', { schema: 'gtfs' })
export class CalendarDates {
  @Column('integer', { primary: true, name: 'service_id' })
  serviceId: number;

  @Column('timestamp with time zone', { primary: true, name: 'date' })
  date: Date;

  @Column('integer', { name: 'exception_type' })
  exceptionType: number;
}
