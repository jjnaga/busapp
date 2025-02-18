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
    console.log('new stop btw?', stops[state.selectedStop]);
    return stops[state.selectedStop];
  }
);
