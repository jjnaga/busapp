import { createFeatureSelector } from '@ngrx/store';
import { VehiclesState } from './vehicles.reducers';

export const selectVehiclesState =
  createFeatureSelector<VehiclesState>('vehicles');
