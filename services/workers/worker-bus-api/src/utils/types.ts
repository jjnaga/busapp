export type JOB_STATUS = 'success' | 'failed';

export interface JOB_RESULT {
  status: JOB_STATUS;
  message: string;
  data?: object;
  duration?: string;
  durationEachComponent?: {
    [component: string]: string;
  };
}

export interface VehicleApi {
  number: string;
  trip: string;
  driver: string;
  latitude: string;
  longitude: string;
  adherence: string;
  last_message: string;
  route_short_name: string;
  headsign: string;
}
