import { Column, Entity, Index } from 'typeorm';

@Index('calendar_pkey', ['serviceId'], { unique: true })
@Entity('calendar', { schema: 'gtfs' })
export class Calendar {
  @Column('integer', { primary: true, name: 'service_id' })
  serviceId: number;

  @Column('integer', { name: 'monday' })
  monday: number;

  @Column('integer', { name: 'tuesday' })
  tuesday: number;

  @Column('integer', { name: 'wednesday' })
  wednesday: number;

  @Column('integer', { name: 'thursday' })
  thursday: number;

  @Column('integer', { name: 'friday' })
  friday: number;

  @Column('integer', { name: 'saturday' })
  saturday: number;

  @Column('integer', { name: 'sunday' })
  sunday: number;

  @Column('timestamp with time zone', { name: 'start_date' })
  startDate: Date;

  @Column('timestamp with time zone', { name: 'end_date' })
  endDate: Date;

  @Column('character varying', {
    name: 'events_and_status',
    nullable: true,
    length: 15,
  })
  eventsAndStatus: string | null;

  @Column('character varying', { name: 'operating_days', length: 21 })
  operatingDays: string;

  @Column('character varying', { name: 'duty', nullable: true, length: 24 })
  duty: string | null;
}
