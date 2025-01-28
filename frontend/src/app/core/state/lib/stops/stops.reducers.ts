import { createReducer, on } from '@ngrx/store';
import { Stop } from '../../../utils/global.types';
import { loadStopsFailure, loadStopsSuccess } from './stops.actions';

export interface StopsState {
  stops: Stop[];
  loading: boolean;
}

export const initialStopsState: StopsState = {
  stops: [],
  loading: true,
};

export const stopsReducer = createReducer(
  initialStopsState,
  on(loadStopsSuccess, (state, { stops }) => ({
    ...state,
    stops,
    loading: false,
  })),
  on(loadStopsFailure, (state) => ({
    ...state,
    loading: false,
  }))
);
