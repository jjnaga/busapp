import { z } from 'zod';
import { parse, formatDistanceToNow } from 'date-fns';
import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export const ShapePointSchema = z.object({
  shapeId: z.number(),
  lat: z.number(),
  lon: z.number(),
  sequence: z.number(),
});

export const VehicleShapeResponseSchema = z.object({
  status: z.string(),
  data: z.object({
    tripId: z.number(),
    shapes: z.array(ShapePointSchema),
  }),
});

// Define the transformed shape type for Google Maps
export const RouteShapeSchema = z.array(
  z.object({
    lat: z.number(),
    lng: z.number(), // Converted from 'lon' to 'lng' for Google Maps compatibility
  })
);

export type ShapePoint = z.infer<typeof ShapePointSchema>;
export type VehicleShapeResponse = z.infer<typeof VehicleShapeResponseSchema>;
export type RouteShape = z.infer<typeof RouteShapeSchema>;

export const VehicleSchema = z
  .object({
    busNumber: z.string(),
    tripId: z.number().nullable(),
    driver: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    adherence: z.number(),
    heartbeat: z.preprocess((arg) => {
      // Convert string dates to Date objects
      if (typeof arg === 'string') {
        const parsedDate = new Date(arg);
        if (isNaN(parsedDate.getTime())) {
          return undefined;
        }
        return parsedDate;
      }
      return arg;
    }, z.date()),
    heartbeatFormatted: z.string().optional(),
    routeName: z.string(),
    headsign: z.string(),
    routeShape: RouteShapeSchema.optional(), // Add the route shape property
  })
  .transform((data) => {
    return {
      ...data,
      heartbeatFormatted:
        data.heartbeat instanceof Date
          ? formatDistanceToNow(data.heartbeat, { addSuffix: true })
          : data.heartbeatFormatted || 'unknown',
    };
  });

export const VehicleMapSchema = z.record(z.number(), VehicleSchema);
export const VehicleArraySchema = z.array(VehicleSchema);

export type Vehicle = z.infer<typeof VehicleSchema>;
export type VehicleMap = z.infer<typeof VehicleMapSchema>;
export type VehicleArray = z.infer<typeof VehicleArraySchema>;

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
  distance?: number; // Add this line
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
  latitude: z.preprocess((arg) => {
    if (typeof arg === 'string') {
      const num = parseFloat(arg);
      return isNaN(num) ? undefined : num;
    }
    return arg;
  }, z.number().nullable()),
  longitude: z.preprocess((arg) => {
    if (typeof arg === 'string') {
      const num = parseFloat(arg);
      return isNaN(num) ? undefined : num;
    }
    return arg;
  }, z.number().nullable()),
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

export interface CameraStrategy {
  execute(map: MapController): void;
  cleanup(): void;
}

export interface MapController {
  panAndZoom(center: google.maps.LatLngLiteral, zoom: number): void;
  fitBounds(bounds: google.maps.LatLngBounds, padding?: number | google.maps.Padding): void;
  getBounds: () => google.maps.LatLngBounds | undefined;
  updateZoom: (zoom: number | undefined) => void;
  getZoom: () => number | undefined;
  zoom$: Observable<number | undefined>;
}

export const MAP_CONTROLLER = new InjectionToken<MapController>('MapController');
