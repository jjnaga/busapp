import { createAction, props } from '@ngrx/store';
import { Stop } from '../../../utils/global.types';

export const loadStops = createAction('[Stops] Load Stops');
export const loadStopsSuccess = createAction('[Stops] Load Stops Success', props<{ stops: Stop[] }>());
export const loadStopsFailure = createAction('[Stops] Load Stops Failure', props<{ error: string }>());

export const loadDetailedStops = createAction('[Stop Data] Load Detailed Stops', props<{ stopIds: string[] }>());
export const loadDetailedStopsSuccess = createAction(
  '[Stop Data] Load Detailed Stops Success',
  props<{ stopIds: Stop[] }>()
);
export const loadDetailedStopsFailure = createAction(
  '[Stop Data] Load Detailed Stops Failure',
  props<{ stop?: Stop; stopId?: string; error?: any }>()
);

export const startTrackingStops = createAction('[Stops] Start Tracking Stops', props<{ stopIds: string[] }>());
export const stopTrackingStops = createAction('[Stops] Stop Tracking Stops', props<{ stopIds: string[] }>());
