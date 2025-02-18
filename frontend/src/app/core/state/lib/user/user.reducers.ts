import { createReducer, on } from '@ngrx/store';
import { DrawerMode, Stop } from '../../../utils/global.types';
import { setDrawerMode, setSelectedStop, toggleDrawerExpanded } from './user.actions';

export interface UserState {
  // start abstracting drawer into its own object?
  drawerMode: DrawerMode;
  drawerExpanded: boolean;
  selectedStop?: Stop['stopId'];
}

export const initialUserState: UserState = {
  drawerMode: DrawerMode.Stops,
  drawerExpanded: false,
  selectedStop: undefined,
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
    selectedStop: stop?.stopId,
  }))
);
