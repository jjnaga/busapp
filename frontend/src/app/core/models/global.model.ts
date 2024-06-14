export interface Vehicle {
  busNumber: string;
  tripID: string;
  driver: string;
  latitude: number;
  longitude: number;
  adherence: number;
  heartbeat: Date;
  routeName: string;
  headsign: string;
}

export interface Vehicles {
  [vehicleNumber: string]: Vehicle;
}
