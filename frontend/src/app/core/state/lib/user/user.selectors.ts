import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState } from './user.reducers';
import { Stop } from '../../../utils/global.types';

export const selectUserState = createFeatureSelector<UserState>('user');

export const selectDrawerMode = createSelector(selectUserState, (state: UserState) => state.drawerMode);

export const selectDrawerExpanded = createSelector(selectUserState, (state: UserState) => state.drawerExpanded);

export const selectSelectedStop = createSelector(selectUserState, (state: UserState) => state.selectedStop);
