import { createReducer, on } from '@ngrx/store';
import { Vehicle, VehicleMap } from '../../../utils/global.types';
import { loadVehiclesFailure, loadVehiclesSuccess, updateVehicles } from './vehicles.actions';

export interface VehiclesState {
  vehicles: VehicleMap;
  loading: boolean;
}

export const initialVehicleState: VehiclesState = {
  vehicles: {},
  loading: true,
};

export const vehiclesReducer = createReducer(
  initialVehicleState,
  on(loadVehiclesSuccess, (state, { vehicles }) => ({
    ...state,
    vehicles: vehicles.reduce((map, vehicle) => {
      map[vehicle.busNumber] = vehicle;
      return map;
    }, {} as { [busNumber: string]: Vehicle }),
    loading: false,
  })),
  on(loadVehiclesFailure, (state) => ({
    ...state,
    loading: false,
  })),
  on(updateVehicles, (state, { vehicles }) => {
    const updatedVehicles = vehicles.reduce(
      (map, vehicle) => {
        map[vehicle.busNumber] = vehicle;
        return map;
      },
      { ...state.vehicles }
    );

    return {
      ...state,
      vehicles: updatedVehicles,
    };
  })
);
