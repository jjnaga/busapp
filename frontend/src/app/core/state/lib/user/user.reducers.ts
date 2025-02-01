import { createReducer, on } from '@ngrx/store';
import {
  DetailedStop,
  DrawerMode,
  SelectedStop,
  Stop,
} from '../../../utils/global.types';
import {
  setDrawerMode,
  setSelectedStop,
  toggleDrawerExpanded,
  updateSelectedStop,
} from './user.actions';

export interface UserState {
  // start abstracting drawer into its own object?
  drawerMode: DrawerMode;
  drawerExpanded: boolean;
  favorites: Stop[];
  selectedStop: SelectedStop;
}

export const initialUserState: UserState = {
  drawerMode: DrawerMode.Stops,
  drawerExpanded: false,
  selectedStop: null,
  favorites: [],
};

export const userReducer = createReducer(
  initialUserState,
  on(setDrawerMode, (state, { drawerMode }) => ({
    ...state,
    drawerMode,
  })),
  on(toggleDrawerExpanded, (state, { expanded }) => ({
    ...state,
    drawerExpanded: expanded === undefined ? !state.drawerExpanded : expanded,
  })),
  on(setSelectedStop, (state, { stop }) => ({
    ...state,
    selectedStop: stop,
  })),
  on(updateSelectedStop, (state, { stop }) => ({
    ...state,
    selectedStop: stop,
  }))
);
