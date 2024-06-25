export interface Vehicle {
  busNumber: string;
  tripId: string;
  driver: string;
  latitude: number;
  longitude: number;
  adherence: number;
  heartbeat: Date;
  heartbeatFormatted?: string;
  routeName: string;
  headsign: string;
}

export type SelectedStop = Stop | undefined;

export interface Stop {
  stopId: string;
  stopCode: string | null;
  stopName: string | null;
  stopLat: number | null;
  stopLon: number | null;
  stopUrl: string | null;
  stopSerialNumber: number | null;
}

export type Vehicles = Map<string, Vehicle>;
