import { createReducer, on } from '@ngrx/store';
import { DrawerMode, Stop } from '../../../utils/global.types';
import { setDrawerMode, toggleDrawerExpanded } from './user.actions';

export interface UserState {
  // start abstracting drawer into its own object?
  drawerMode: DrawerMode;
  drawerExpanded: boolean;
  selectedStop: Stop | null;
}

export const initialUserState: UserState = {
  drawerMode: DrawerMode.Stops,
  drawerExpanded: false,
  selectedStop: null,
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
  }))
);
