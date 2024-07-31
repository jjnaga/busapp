import { Column, Entity, Index } from "typeorm";

@Index("trips_pkey", ["tripId"], { unique: true })
@Entity("trips", { schema: "gtfs" })
export class Trips {
  @Column("integer", { name: "route_id", nullable: true })
  routeId: number | null;

  @Column("integer", { name: "service_id", nullable: true })
  serviceId: number | null;

  @Column("integer", { primary: true, name: "trip_id" })
  tripId: number;

  @Column("character varying", {
    name: "trip_headsign",
    nullable: true,
    length: 50,
  })
  tripHeadsign: string | null;

  @Column("integer", { name: "direction_id", nullable: true })
  directionId: number | null;

  @Column("integer", { name: "block_id", nullable: true })
  blockId: number | null;

  @Column("character varying", { name: "shape_id", nullable: true, length: 17 })
  shapeId: string | null;

  @Column("character varying", {
    name: "trip_headsign_short",
    nullable: true,
    length: 39,
  })
  tripHeadsignShort: string | null;

  @Column("integer", { name: "apc_trip_id", nullable: true })
  apcTripId: number | null;

  @Column("character varying", {
    name: "display_code",
    nullable: true,
    length: 10,
  })
  displayCode: string | null;

  @Column("integer", { name: "trip_serial_number", nullable: true })
  tripSerialNumber: number | null;

  @Column("character varying", { name: "block", nullable: true, length: 9 })
  block: string | null;
}
