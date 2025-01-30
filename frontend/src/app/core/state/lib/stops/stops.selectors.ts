import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StopsState } from './stops.reducers';

export const selectStopsState = createFeatureSelector<StopsState>('stops');

export const selectAllStops = createSelector(
  selectStopsState,
  (state: StopsState) => state.stops
);

export const selectStopsLoading = createSelector(
  selectStopsState,
  (state: StopsState) => {
    return state.loading;
  }
);
