import { createReducer, on } from '@ngrx/store';
import { Vehicle } from '../../../utils/global.types';
import { loadVehiclesFailure, loadVehiclesSuccess, updateVehiclesSuccess } from './vehicles.actions';
import { createEntityAdapter, EntityState } from '@ngrx/entity';

// Create entity adapter
export const vehicleAdapter = createEntityAdapter<Vehicle>({
  selectId: (vehicle) => vehicle.busNumber,
  sortComparer: false,
});

export interface VehiclesState extends EntityState<Vehicle> {
  loading: boolean;
}

export const initialVehicleState: VehiclesState = vehicleAdapter.getInitialState({
  loading: true,
});

export const vehiclesReducer = createReducer(
  initialVehicleState,
  on(loadVehiclesSuccess, (state, { vehicles }) => vehicleAdapter.setAll(vehicles, { ...state, loading: false })),
  on(loadVehiclesFailure, (state) => ({
    ...state,
    loading: false,
  })),
  on(updateVehiclesSuccess, (state, { vehicles }) => vehicleAdapter.upsertMany(vehicles, state))
);
