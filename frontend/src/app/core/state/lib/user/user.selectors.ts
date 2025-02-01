import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState } from './user.reducers';

export const selectUserState = createFeatureSelector<UserState>('user');

export const selectDrawerMode = createSelector(
  selectUserState,
  (state: UserState) => state.drawerMode
);
