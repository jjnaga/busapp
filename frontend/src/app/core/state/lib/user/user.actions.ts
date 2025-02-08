import { createAction, createSelector, props } from '@ngrx/store';
import { DrawerMode, Stop } from '../../../utils/global.types';

// Toggle the icons in the bottom menu
export const setDrawerMode = createAction('[User] Set Drawer Mode', props<{ drawerMode: DrawerMode }>());

// Set the selected stop
export const setSelectedStop = createAction('[User] Set Selected Stop', props<{ stop: Stop }>());

// Update the selected stop
export const updateSelectedStop = createAction('[User] Update Selected Stop', props<{ stop: Stop }>());

// we're not using this tbh
export const updateSelectedStopFailure = createAction(
  '[User] Update Selected Stop Failure',
  props<{ error: string }>(),
);

// can pick or just flip if no props are passed
export const toggleDrawerExpanded = createAction('[User] Toggle Drawer Expanded', props<{ expanded?: boolean }>());

// TODO
export const addFavorite = createAction('[User] Add Favorite', props<{ stop: Stop }>());

// TODO
export const removeFavorite = createAction('[User] Remove Favorite', props<{ stopId: string }>());
