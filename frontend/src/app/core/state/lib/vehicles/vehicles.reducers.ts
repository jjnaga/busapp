import { createReducer, on } from '@ngrx/store';
import { Vehicle } from '../../../utils/global.types';
import {
  loadVehiclesFailure,
  loadVehiclesSuccess,
  updateVehiclesSuccess,
  loadVehicleShape,
  loadVehicleShapeSuccess,
  loadVehicleShapeFailure,
} from './vehicles.actions';
import { createEntityAdapter, EntityState } from '@ngrx/entity';

// Create entity adapter
export const vehicleAdapter = createEntityAdapter<Vehicle>({
  selectId: (vehicle) => vehicle.busNumber,
  sortComparer: false,
});

export interface VehiclesState extends EntityState<Vehicle> {
  loading: boolean;
  loadingShapes: string[]; // Track vehicles with currently loading shapes
}

export const initialVehicleState: VehiclesState = vehicleAdapter.getInitialState({
  loading: true,
  loadingShapes: [],
});

export const vehiclesReducer = createReducer(
  initialVehicleState,

  on(loadVehiclesSuccess, (state, { vehicles }) => vehicleAdapter.setAll(vehicles, { ...state, loading: false })),

  on(loadVehiclesFailure, (state) => ({
    ...state,
    loading: false,
  })),

  on(updateVehiclesSuccess, (state, { vehicles }) => vehicleAdapter.upsertMany(vehicles, state)),

  // Add vehicle ID to loading shapes when starting shape load
  on(loadVehicleShape, (state, { vehicleId }) => ({
    ...state,
    loadingShapes: [...state.loadingShapes, vehicleId],
  })),

  // Update vehicle entity with the route shape on success
  on(loadVehicleShapeSuccess, (state, { vehicleId, routeShape }) => {
    // Update the vehicle with the route shape
    return {
      ...vehicleAdapter.updateOne(
        {
          id: vehicleId,
          changes: { routeShape },
        },
        state
      ),
      // Remove vehicle ID from loading shapes
      loadingShapes: state.loadingShapes.filter((id) => id !== vehicleId),
    };
  }),

  // Remove vehicle ID from loading shapes on error
  on(loadVehicleShapeFailure, (state, { vehicleId }) => ({
    ...state,
    loadingShapes: state.loadingShapes.filter((id) => id !== vehicleId),
  }))
);
