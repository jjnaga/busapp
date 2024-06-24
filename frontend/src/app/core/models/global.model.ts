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

export type Vehicles = Map<string, Vehicle>;
