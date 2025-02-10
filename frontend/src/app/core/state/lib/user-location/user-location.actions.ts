import { createAction, props } from '@ngrx/store';

export const startLocationTracking = createAction('[User Location] Start Tracking');

export const userLocationUpdate = createAction(
  '[User Location] Update',
  props<{ latitude: number; longitude: number }>()
);

export const userLocationError = createAction('[User Location] Error', props<{ error: string }>());
