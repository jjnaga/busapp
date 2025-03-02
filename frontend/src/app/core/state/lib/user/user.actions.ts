import { createAction, props } from '@ngrx/store';
import { DrawerMode, Stop } from '../../../utils/global.types';

// Toggle the icons in the bottom menu
export const setDrawerMode = createAction('[User] Set Drawer Mode', props<{ drawerMode: DrawerMode }>());

// Set the selected stop
export const setSelectedStop = createAction('[User] Set Selected Stop', props<{ stop: Stop | null }>());

// we're not using this tbh
export const updateSelectedStopFailure = createAction(
  '[User] Update Selected Stop Failure',
  props<{ error: string }>()
);

// can pick or just flip if no props are passed
export const toggleDrawerExpanded = createAction('[User] Toggle Drawer Expanded', props<{ expanded?: boolean }>());

export const setStopCustomName = createAction(
  '[User] Set Stop Custom Name',
  props<{ stopId: string; customName: string | null }>()
);

export const setSelectedVehicle = createAction('[User] Set Selected Vehicle', props<{ vehicleId: string | null }>());
