import { Vehicle } from '@typeorm/entities/Vehicle';

export interface VehicleSql {
  bus_number: string;
  trip_id: number | null;
  driver: string;
  latitude: number;
  longitude: number;
  adherence: number;
  heartbeat: string;
  route_name: string;
  headsign: string;
}

// Define a type for the coordinates
export interface Coordinate {
  x: number;
  y: number;
}

// Define a type for the bounding box
export interface BoundingBox {
  topLeft: Coordinate;
  bottomRight: Coordinate;
}

export interface Shape {
  shapeId: number;
  shapePtLat: number;
  shapePtLon: number;
  shapePtSequence: number;
}

export interface VehicleWithShape extends Vehicle {
  shapePoints: Shape[];
}
