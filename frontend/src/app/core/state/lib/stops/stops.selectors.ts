import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StopsState } from './stops.reducers';

export const selectVehiclesState =
  createFeatureSelector<StopsState>('vehicles');

export const selectAllVehicles = createSelector(
  selectVehiclesState,
  (state: StopsState) => state.stops
);

export const selectVehiclesLoading = createSelector(
  selectVehiclesState,
  (state: StopsState) => {
    return state.loading;
  }
);
