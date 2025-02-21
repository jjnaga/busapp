import { createReducer, on } from '@ngrx/store';
import { DrawerMode, Stop } from '../../../utils/global.types';
import { setDrawerMode, setSelectedStop, setStopCustomName, toggleDrawerExpanded } from './user.actions';

export interface UserState {
  // abstract drawer into its own feature?
  drawerMode: DrawerMode;
  drawerExpanded: boolean;
  selectedStop?: Stop['stopId'];
  stopPreferences: {
    [stopId: string]: {
      customName: string;
    };
  };
}

export const initialUserState: UserState = {
  drawerMode: DrawerMode.Favorites,
  drawerExpanded: true,
  stopPreferences: {},
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
  })),
  on(setStopCustomName, (state, { stopId, customName }) => {
    const newPreferences = { ...state.stopPreferences };

    if (customName && customName.trim()) {
      newPreferences[stopId] = { customName };
    } else {
      delete newPreferences[stopId];
    }

    return {
      ...state,
      stopPreferences: newPreferences,
    };
  })
);
