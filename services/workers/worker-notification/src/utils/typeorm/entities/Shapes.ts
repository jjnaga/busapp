import { Column, Entity, Index } from "typeorm";

@Index("shapes_pkey", ["shapeId", "shapePtSequence"], { unique: true })
@Entity("shapes", { schema: "gtfs" })
export class Shapes {
  @Column("character varying", { primary: true, name: "shape_id", length: 255 })
  shapeId: string;

  @Column("double precision", {
    name: "shape_pt_lat",
    nullable: true,
    precision: 53,
  })
  shapePtLat: number | null;

  @Column("double precision", {
    name: "shape_pt_lon",
    nullable: true,
    precision: 53,
  })
  shapePtLon: number | null;

  @Column("integer", { primary: true, name: "shape_pt_sequence" })
  shapePtSequence: number;
}
