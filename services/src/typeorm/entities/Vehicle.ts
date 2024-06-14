// @ts-nocheck
// jjn 6/10/24 typeorm is doing something special with these decoraters that TS either can't support yet
// or its experimental or something. The fix I see online of setting strictPropertyInitialization to false
// will cause more issues then just ignoring this file for now.
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
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
