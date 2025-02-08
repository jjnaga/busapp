import { Column, Entity, Index } from 'typeorm';

@Index('stop_times_pkey', ['stopSequence', 'tripId'], { unique: true })
@Entity('stop_times', { schema: 'gtfs' })
export class StopTimes {
  @Column('bigint', { primary: true, name: 'trip_id' })
  tripId: string;

  @Column('integer', { name: 'arrival_time', nullable: true })
  arrivalTime: number | null;

  @Column('integer', { name: 'departure_time', nullable: true })
  departureTime: number | null;

  @Column('character varying', { name: 'stop_id', nullable: true, length: 15 })
  stopId: string | null;

  @Column('integer', { primary: true, name: 'stop_sequence' })
  stopSequence: number;

  @Column('integer', { name: 'pickup_type', nullable: true })
  pickupType: number | null;

  @Column('integer', { name: 'drop_off_type', nullable: true })
  dropOffType: number | null;

  @Column('double precision', {
    name: 'shape_dist_traveled',
    nullable: true,
    precision: 53,
  })
  shapeDistTraveled: number | null;

  @Column('integer', { name: 'stop_code', nullable: true })
  stopCode: number | null;
}
