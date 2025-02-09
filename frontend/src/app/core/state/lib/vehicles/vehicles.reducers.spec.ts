// vehicles.reducer.spec.ts
import { vehiclesReducer, initialVehicleState } from './vehicles.reducers';
import { loadVehiclesSuccess, loadVehiclesFailure } from './vehicles.actions';

describe('Vehicles Reducer', () => {
  test('should update vehicles and set loading to false on success', () => {
    const vehicles = [
      {
        busNumber: '100',
        tripId: 'v1',
        driver: 'John',
        latitude: 10,
        longitude: 10,
        adherence: 0,
        heartbeat: new Date(),
        routeName: 'Route 1',
        headsign: 'Downtown',
      },
    ];
    const action = loadVehiclesSuccess({ vehicles });
    const state = vehiclesReducer(initialVehicleState, action);
    expect(state.vehicles).toEqual(vehicles);
    expect(state.loading).toBe(false);
  });

  test('should set loading to false on failure', () => {
    const action = loadVehiclesFailure({ error: 'Error' });
    const state = vehiclesReducer(initialVehicleState, action);
    expect(state.loading).toBe(false);
  });
});
