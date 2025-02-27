import { createReducer, on } from '@ngrx/store';
import { DrawerMode, Stop } from '../../../utils/global.types';
import {
  setDrawerMode,
  setSelectedArrival,
  setSelectedStop,
  setStopCustomName,
  toggleDrawerExpanded,
} from './user.actions';

export interface UserState {
  // abstract drawer into its own feature?
  drawerMode: DrawerMode;
  drawerExpanded: boolean;
  selectedStop?: Stop['stopId'];
  selectedArrivalIndex: number | null;
  stopPreferences: {
    [stopId: string]: {
      customName: string;
    };
  };
}

export const initialUserState: UserState = {
  drawerMode: DrawerMode.Favorites,
  drawerExpanded: true,
  stopPreferences: {
    '47': {
      customName: 'work to home',
    },
    '2819': {
      customName: 'home to mom and dad',
    },
    '2848': {
      customName: 'home to town',
    },
    '2918': {
      customName: '32 to parents',
    },
    '2925': {
      customName: 'test',
    },
  },
  selectedArrivalIndex: null,
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
    selectedArrivalIndex: null,
  })),
  on(setSelectedArrival, (state, { arrivalIndex }) => ({
    ...state,
    selectedArrivalIndex: arrivalIndex,
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
