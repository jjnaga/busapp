import { z } from 'zod';
import { parse } from 'date-fns';

export type VehicleMap = {
  [busNumber: string]: Vehicle;
};

export type Vehicle = {
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
};

// StopBase is from our internal DB
export interface StopBase {
  stopId: string;
  stopCode: string;
  stopName: string | null;
  stopLat: number | null;
  stopLon: number | null;
  stopUrl: string | null;
  stopSerialNumber: number | null;
}

// data from bus API
export interface Stop extends StopBase {
  arrivals?: Arrival[];
  loading?: boolean;
  errors?: String;
  lastUpdated?: Date;
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

export const ArrivalSchema = z.object({
  canceled: z.string(),
  date: z.string(),
  direction: z.string(),
  estimated: z.string(),
  headsign: z.string(),
  id: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  route: z.string(),
  shape: z.string(),
  stopTime: z.string(),
  arrivalDate: z.date().optional(),
  trip: z.string(),
  vehicle: z.string(),
});

export const StopApiResponseSchema = z.object({
  stop: z.string(),
  timestamp: z.preprocess((arg) => {
    if (typeof arg === 'string') {
      const parsedDate = parse(arg, 'M/d/yyyy h:mm:ss a', new Date());

      if (isNaN(parsedDate.getTime())) {
        return undefined;
      }
      return parsedDate;
    }
    return arg;
  }, z.date()),
  arrivals: z.array(ArrivalSchema),
});

export type StopApiResponse = z.infer<typeof StopApiResponseSchema>;
export type Arrival = z.infer<typeof ArrivalSchema>;

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

export type TrackedVehicle = Vehicle | null;

export type TrackerComponentMode = {
  stop: boolean;
  bus: boolean;
  both: boolean;
};

export type VehicleWithlastUpdated = Vehicle & { lastUpdated: number };

export type TrackerModel = {
  vehicle?: VehicleWithlastUpdated;
  stop?: Stop;
  arrival?: Arrival;
  mode?: TrackerMode;
};

export type TrackerMode = {
  both: boolean;
  bus: boolean;
  stop: boolean;
};

export enum DrawerMode {
  Favorites = 'favorites',
  Stops = 'stops',
}

export type StopDataState = {
  entities: { [stopId: string]: Stop };
  loading: string[];
  errors: { [stopId: string]: string };
};
