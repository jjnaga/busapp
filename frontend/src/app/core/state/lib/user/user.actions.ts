import { createAction, createSelector, props } from '@ngrx/store';
import { DrawerMode, Stop } from '../../../utils/global.types';

export const setDrawerMode = createAction(
  '[User] Set Drawer Mode',
  props<{ drawerMode: DrawerMode }>()
);

export const setSelectedStop = createAction(
  '[User] Set Selected Stop',
  props<{ stop: Stop }>()
);

export const updateSelectedStop = createAction(
  '[User] Update Selected Stop',
  props<{ stop: Stop }>()
);

export const updateSelectedStopFailure = createAction(
  '[User] Update Selected Stop Failure',
  props<{ error: string }>()
);

export const toggleDrawerExpanded = createAction(
  '[User] Toggle Drawer Expanded',
  props<{ expanded?: boolean }>()
);

export const addFavorite = createAction(
  '[User] Add Favorite',
  props<{ stop: Stop }>()
);

export const removeFavorite = createAction(
  '[User] Remove Favorite',
  props<{ stopId: string }>()
);
