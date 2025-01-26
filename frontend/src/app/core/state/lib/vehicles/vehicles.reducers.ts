import { createReducer, on } from '@ngrx/store';
import { Vehicle } from '../../../utils/global.types';
import { loadVehiclesSuccess } from './vehicles.actions';

export interface VehiclesState {
  vehicles: Vehicle[];
}

export const initialVehicleState: VehiclesState = {
  vehicles: [],
};

export const vehiclesReducer = createReducer(
  initialVehicleState,
  on(loadVehiclesSuccess, (state, { vehicles }) => ({
    ...state,
    vehicles,
  }))
);
