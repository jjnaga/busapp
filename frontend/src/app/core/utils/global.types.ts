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
  stopCode: string;
  stopName: string | null;
  stopLat: number | null;
  stopLon: number | null;
  stopUrl: string | null;
  stopSerialNumber: number | null;
}

export type Vehicles = Map<string, Vehicle>;

export type AppTypes = 'bus' | 'stop';

export interface Marker {
  id: string;
  position: google.maps.LatLngLiteral;
  stopCode?: string;
  favorite?: boolean;
  title: string;
  type: AppTypes;
  options?: any;
  content?: any;
}

export type sideBarModes = 'favorites' | 'stop' | 'subscriptions' | null;

export interface StopApiResponse {
  stop: string;
  timestamp: Date;
  arrivals: Arrival[];
}

export interface Arrival {
  canceled: string;
  date: string;
  direction: string;
  estimated: string;
  headsign: string;
  id: string;
  latitude: string;
  longitude: string;
  route: string;
  shape: string;
  stopTime: string;
  trip: string;
  vehicle: string;
}

export interface BusSubscription {
  type: AppTypes;
  stopId?: string;
  busId?: string;
  notificationDate?: Date;
}

export interface FavoritesViewModel {
  favoritesNearby: Stop[];
  favoriteInViewIndex: number | null;
}
