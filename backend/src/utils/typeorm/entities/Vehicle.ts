import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('vehicles')
export class Vehicle {
  @PrimaryColumn('text', { name: 'bus_number' })
  busNumber: string;

  @Column('text', { name: 'trip_id', nullable: true })
  tripID: string;

  @Column('text', { nullable: true })
  driver: string;

  @Column('float', { nullable: true })
  latitude: number;

  @Column('float', { nullable: true })
  longitude: number;

  @Column('integer', { nullable: true })
  adherence: number;

  @Column('timestamp', { nullable: true })
  heartbeat: Date;

  @Column('text', { name: 'route_name', nullable: true })
  routeName: string;

  @Column('text', { nullable: true })
  headsign: string;

  constructor(init?: Partial<Vehicle>) {
    Object.assign(this, init);
  }
}
