import { createAction, props } from '@ngrx/store';
import { Vehicle } from '../../../utils/global.types';

export const loadVehicles = createAction('[Vehicles] Load Vehicles');

export const loadVehiclesSuccess = createAction('[Vehicles] Load Vehicles Success', props<{ vehicles: Vehicle[] }>());

export const loadVehiclesFailure = createAction('[Vehicles] Load Vehicles Failure', props<{ error: string }>());

export const updateVehiclesSuccess = createAction('[Vehicles] Update Vehicles', props<{ vehicles: Vehicle[] }>());
export const updateVehiclesFailure = createAction('[Vehicles] Update Vehicles Failure', props<{ error: string }>());
