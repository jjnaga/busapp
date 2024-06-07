import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('vehicles')
export class Vehicle {
  @PrimaryColumn({ name: 'bus_number' })
  busNumber: string;

  @Column({ name: 'trip_id', nullable: true })
  tripID: string;

  @Column({ nullable: true })
  driver: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ nullable: true })
  adherence: number;

  @Column({ nullable: true })
  heartbeat: Date;

  @Column({ name: 'route_name', nullable: true })
  routeName: string;

  @Column({ nullable: true })
  headsign: string;

  constructor(init?: Partial<Vehicle>) {
    Object.assign(this, init);
  }
}
