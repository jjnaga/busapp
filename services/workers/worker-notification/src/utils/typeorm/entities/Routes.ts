import { Column, Entity, Index } from 'typeorm';

@Index('routes_pkey', ['routeId'], { unique: true })
@Entity('routes', { schema: 'gtfs' })
export class Routes {
  @Column('character varying', { primary: true, name: 'route_id', length: 15 })
  routeId: string;

  @Column('character varying', {
    name: 'route_short_name',
    nullable: true,
    length: 5,
  })
  routeShortName: string | null;

  @Column('character varying', {
    name: 'route_long_name',
    nullable: true,
    length: 75,
  })
  routeLongName: string | null;

  @Column('smallint', { name: 'route_type', nullable: true })
  routeType: number | null;

  @Column('character varying', {
    name: 'agency_id',
    nullable: true,
    length: 15,
  })
  agencyId: string | null;
}
