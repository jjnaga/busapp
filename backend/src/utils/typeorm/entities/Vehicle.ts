import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Vehicle {
  @PrimaryColumn('text')
  busNumber: string;

  @Column('text', { nullable: true })
  tripId: string;

  @Column('text', { nullable: true })
  driver: string;

  @Column('float', { nullable: true })
  latitude: number;

  @Column('float', { nullable: true })
  longitude: number;

  @Column('integer', { nullable: true })
  adherence: number;

  @Column({ type: 'timestamptz', nullable: true })
  heartbeat: Date;

  @Column('text', { nullable: true })
  routeName: string;

  @Column('text', { nullable: true })
  headsign: string;

  constructor(init?: Partial<Vehicle>) {
    Object.assign(this, init);
  }
}
