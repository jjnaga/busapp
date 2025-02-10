import { createReducer, on } from '@ngrx/store';
import * as LocationActions from './user-location.actions';

export interface UserLocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  dateUpdated: Date | null;
}

export const initialUserLocationState: UserLocationState = {
  latitude: null,
  longitude: null,
  error: null,
  dateUpdated: null,
};

export const userLocationReducer = createReducer(
  initialUserLocationState,
  on(LocationActions.userLocationUpdate, (state, { latitude, longitude }) => ({
    ...state,
    latitude,
    longitude,
    error: null,
    dateUpdated: new Date(),
  })),
  on(LocationActions.userLocationError, (state, { error }) => ({
    ...state,
    error,
  }))
);
