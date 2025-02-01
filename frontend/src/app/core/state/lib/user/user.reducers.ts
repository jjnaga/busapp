import { createReducer, on } from '@ngrx/store';
import { DrawerMode, Stop } from '../../../utils/global.types';
import { setDrawerMode } from './user.actions';

export interface UserState {
  drawerMode: DrawerMode;
  favorites: Stop[];
}

export const initialUserState: UserState = {
  drawerMode: DrawerMode.Favorites,
  favorites: [],
};

export const userReducer = createReducer(
  initialUserState,
  on(setDrawerMode, (state, { drawerMode }) => ({
    ...state,
    drawerMode,
  }))
  // on(loadVehiclesSuccess, (state, { vehicles }) => ({
  //   ...state,
  //   vehicles,
  //   loading: false,
  // })),
  // on(loadVehiclesFailure, (state) => ({
  //   ...state,
  //   loading: false,
  // }))
);
