import { Column, Entity, Index } from 'typeorm';

@Index('stops_pkey', ['stopId'], { unique: true })
@Entity('stops', { schema: 'gtfs' })
export class Stops {
  @Column('character varying', { primary: true, name: 'stop_id', length: 13 })
  stopId: string;

  @Column('bigint', { name: 'stop_code', nullable: true })
  stopCode: string | null;

  @Column('character varying', {
    name: 'stop_name',
    nullable: true,
    length: 63,
  })
  stopName: string | null;

  @Column('double precision', {
    name: 'stop_lat',
    nullable: true,
    precision: 53,
  })
  stopLat: number | null;

  @Column('double precision', {
    name: 'stop_lon',
    nullable: true,
    precision: 53,
  })
  stopLon: number | null;

  @Column('character varying', { name: 'stop_url', nullable: true, length: 52 })
  stopUrl: string | null;

  @Column('double precision', {
    name: 'stop_serial_number',
    nullable: true,
    precision: 53,
  })
  stopSerialNumber: number | null;
}
