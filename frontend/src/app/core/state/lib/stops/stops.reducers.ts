import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { Stop } from '../../../utils/global.types';
import { createReducer, on } from '@ngrx/store';
import {
  loadDetailedStopsSuccess,
  loadStopsFailure,
  loadStopsSuccess,
  startTrackingStops,
  stopTrackingStops,
} from './stops.actions';

export const stopsAdapter = createEntityAdapter<Stop>({
  selectId: (stop) => stop.stopId,
  sortComparer: false,
});

export interface StopsState extends EntityState<Stop> {
  // stops that are getting polled via API
  stopsTracking: { [stopId: string]: boolean };
  loading: boolean;
}

export const initialStopsState: StopsState = stopsAdapter.getInitialState({
  stopsTracking: {},
  loading: false,
});

export const stopsReducer = createReducer(
  initialStopsState,
  on(loadStopsSuccess, (state, { stops }) => stopsAdapter.setAll(stops, { ...state, loading: false })),
  on(loadStopsFailure, (state) => ({
    ...state,
    loading: false,
  })),
  on(startTrackingStops, (state, { stops }) => ({
    ...state,
    stopsTracking: stops.reduce(
      (tracking, stop) => ({
        ...tracking,
        [stop.stopId]: true,
      }),
      { ...state.stopsTracking }
    ),
  })),
  on(stopTrackingStops, (state, { stopIds }) => {
    const newTracking = { ...state.stopsTracking };
    stopIds.forEach((id) => {
      delete newTracking[id];
    });
    return { ...state, stopsTracking: newTracking };
  }),
  on(loadDetailedStopsSuccess, (state, { stopIds: updatedStops }) =>
    stopsAdapter.updateMany(
      updatedStops.map((stop) => ({
        id: stop.stopId,
        changes: stop,
      })),
      state
    )
  )
);
