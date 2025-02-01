import { createAction, props } from '@ngrx/store';
import { DrawerMode, Stop } from '../../../utils/global.types';

export const setDrawerMode = createAction(
  '[User] Set Drawer Mode',
  props<{ drawerMode: DrawerMode }>()
);

export const addFavorite = createAction(
  '[User] Add Favorite',
  props<{ stop: Stop }>()
);

export const removeFavorite = createAction(
  '[User] Remove Favorite',
  props<{ stopId: string }>()
);
