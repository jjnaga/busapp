import { createAction, props } from '@ngrx/store';
import { RouteShape, Vehicle } from '../../../utils/global.types';

export const loadVehicles = createAction('[Vehicles] Load Vehicles');

export const loadVehiclesSuccess = createAction('[Vehicles] Load Vehicles Success', props<{ vehicles: Vehicle[] }>());

export const loadVehiclesFailure = createAction('[Vehicles] Load Vehicles Failure', props<{ error: string }>());

export const updateVehiclesSuccess = createAction('[Vehicles] Update Vehicles', props<{ vehicles: Vehicle[] }>());
export const updateVehiclesFailure = createAction('[Vehicles] Update Vehicles Failure', props<{ error: string }>());

export const loadVehicleShape = createAction('[Vehicles] Load Vehicle Shape', props<{ vehicleId: string }>());

export const loadVehicleShapeSuccess = createAction(
  '[Vehicles] Load Vehicle Shape Success',
  props<{ vehicleId: string; routeShape: RouteShape }>()
);

export const loadVehicleShapeFailure = createAction(
  '[Vehicles] Load Vehicle Shape Failure',
  props<{ vehicleId: string; error: string }>()
);
