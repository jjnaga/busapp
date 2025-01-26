import {
  vehiclesReducer,
  VehiclesState,
} from './lib/vehicles/vehicles.reducers';

export interface RootState {
  Vehicles: VehiclesState;
  // stops: StopsState;
  // userDetails: UserDetailsState;
}

export const rootReducer = {
  vehicles: vehiclesReducer,
  // stops: StopsReducer,
  // userDetails: UserDetailsReducer,
};
