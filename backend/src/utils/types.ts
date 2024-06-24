export interface VehicleSql {
  bus_number: string;
  trip_id: string;
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
