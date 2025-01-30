import { createReducer, on } from '@ngrx/store';
import { Vehicle } from '../../../utils/global.types';
import { loadVehiclesFailure, loadVehiclesSuccess } from './vehicles.actions';

export interface VehiclesState {
  vehicles: Vehicle[];
  loading: boolean;
}

export const initialVehicleState: VehiclesState = {
  vehicles: [],
  loading: true,
};

export const vehiclesReducer = createReducer(
  initialVehicleState,
  on(loadVehiclesSuccess, (state, { vehicles }) => ({
    ...state,
    vehicles,
    loading: false,
  })),
  on(loadVehiclesFailure, (state) => ({
    ...state,
    loading: false,
  }))
);
