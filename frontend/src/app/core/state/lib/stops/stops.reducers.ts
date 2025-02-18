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
  // stops that is getting polled via API
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
  on(loadDetailedStopsSuccess, (state, { stopIds: stops }) => {
    return stopsAdapter.updateMany(
      stops.map((stop) => ({
        id: stop.stopId,
        changes: stop,
      })),
      state
    );
  })
);
