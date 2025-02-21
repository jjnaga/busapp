import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState } from './user.reducers';

export const selectUserState = createFeatureSelector<UserState>('user');

export const selectDrawerMode = createSelector(selectUserState, (state: UserState) => state.drawerMode);

export const selectDrawerExpanded = createSelector(selectUserState, (state: UserState) => state.drawerExpanded);

export const selectStopPreferences = createSelector(selectUserState, (state: UserState) => state.stopPreferences);

export const selectSelectedArrivalIndex = createSelector(selectUserState, (state: UserState) => {
  console.log('wtf:', state);
  return state.selectedArrivalIndex;
});
