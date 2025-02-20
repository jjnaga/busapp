import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState } from './user.reducers';
import { selectAllStops } from '../stops/stops.selectors';
import { Stop } from '../../../utils/global.types';

export const selectUserState = createFeatureSelector<UserState>('user');

export const selectDrawerMode = createSelector(selectUserState, (state: UserState) => state.drawerMode);

export const selectDrawerExpanded = createSelector(selectUserState, (state: UserState) => state.drawerExpanded);

export const selectSelectedStop = createSelector(
  selectUserState,
  selectAllStops,
  (state: UserState, stops): Stop | undefined => {
    if (!state.selectedStop || !stops) {
      return undefined;
    }

    const selectedStop = stops[state.selectedStop];

    if (!selectedStop) return undefined;

    return {
      ...selectedStop,
      stopLat: selectedStop.stopLat,
      stopLon: selectedStop.stopLon,
    };
  }
);
