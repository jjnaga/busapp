import { createFeatureSelector } from '@ngrx/store';
import { vehicleAdapter, VehiclesState } from './vehicles.reducers';

export const selectVehiclesState = createFeatureSelector<VehiclesState>('vehicles');

export const { selectAll: selectAllVehicles, selectEntities: selectVehicleEntities } =
  vehicleAdapter.getSelectors(selectVehiclesState);
