export interface Arrival {
  id: string;
  trip: string;
  route: string;
  headsign: string;
  direction: string;
  vehicle: string;
  estimated: string;
  stopTime: string;
  date: string;
  longitude: string;
  latitude: string;
  shape: string;
  canceled: string;
}

export interface Arrivals {
  stop: string;
  timestamp: Date;
  arrivals: Arrival[];
}
