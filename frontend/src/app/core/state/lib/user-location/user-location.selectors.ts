// src/app/core/state/lib/user-location/user-location.selectors.ts
import { createFeatureSelector } from '@ngrx/store';
import { UserLocationState } from './user-location.reducers';

export const selectUserLocation = createFeatureSelector<UserLocationState>('user-location');
