import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState } from './user.reducers';

export const selectUserState = createFeatureSelector<UserState>('user');

export const selectDrawerMode = createSelector(selectUserState, (state: UserState) => state.drawerMode);

export const selectDrawerExpanded = createSelector(selectUserState, (state: UserState) => state.drawerExpanded);

// TODO: interesting question -- who should own this. stops or user. either way, we have to join them, no?
export const selectSelectedStop = createSelector(selectUserState, (state: UserState) => state.selectedStop);
