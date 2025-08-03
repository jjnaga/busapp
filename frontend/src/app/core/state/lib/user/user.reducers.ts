import { createReducer, on } from '@ngrx/store';
import { DrawerMode, Stop } from '../../../utils/global.types';
import {
  setDrawerMode,
  setSelectedVehicle,
  setSelectedStop,
  setStopCustomName,
  toggleDrawerExpanded,
} from './user.actions';

export interface UserState {
  // abstract drawer into its own feature?
  drawerMode: DrawerMode;
  drawerExpanded: boolean;
  selectedStop?: Stop['stopId'];
  selectedVehicle: string | null; // Changed from selectedArrivalIndex
  stopPreferences: {
    [stopId: string]: {
      customName: string;
    };
  };
}

export const initialUserState: UserState = {
  drawerMode: DrawerMode.Home,
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
    '738': {
      customName: 'times 🫡',
    },
  },
  selectedVehicle: null, // Changed from selectedArrivalIndex
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
    selectedVehicle: null, // Reset vehicle selection when stop changes
  })),
  on(setSelectedVehicle, (state, { vehicleId }) => ({
    ...state,
    selectedVehicle: vehicleId,
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
