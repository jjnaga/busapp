// jjn 6/10/24 typeorm is doing something special with these decoraters that TS either can't support yet
// or its experimental or something. The fix I see online of setting strictPropertyInitialization to false
// will cause more issues then just ignoring this file for now.
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Vehicle {
  @PrimaryColumn({ type: 'text' })
  busNumber: string;

  // @Column({ name: 'trip_id', nullable: true })
  @Column({ type: 'text', nullable: true })
  tripId: string;

  @Column({ type: 'text', nullable: true })
  driver: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ type: 'int', nullable: true })
  adherence: number;

  @Column({ type: 'timestamptz', nullable: true })
  heartbeat: Date;

  @Column({ type: 'text', nullable: true })
  routeName: string;

  @Column({ type: 'text', nullable: true })
  headsign: string;

  constructor(init?: Partial<Vehicle>) {
    Object.assign(this, init);
  }
}
