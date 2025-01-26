import { createFeatureSelector, createSelector } from '@ngrx/store';
import { VehiclesState } from './vehicles.reducers';

export const selectVehiclesState =
  createFeatureSelector<VehiclesState>('vehicles');

export const selectAllVehicles = createSelector(
  selectVehiclesState,
  (state: VehiclesState) => state.vehicles
);

export const selectVehiclesLoading = createSelector(
  selectVehiclesState,
  (state: VehiclesState) => {
    return state.loading;
  }
);
