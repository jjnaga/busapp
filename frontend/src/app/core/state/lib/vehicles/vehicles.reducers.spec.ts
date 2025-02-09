// vehicles.reducers.spec.ts (augmented)
import { vehiclesReducer, initialVehicleState } from './vehicles.reducers';
import { updateVehicles } from './vehicles.actions';
import { Vehicle } from '../../../utils/global.types';

describe('Vehicles Reducer', () => {
  const initialVehicle: Vehicle = {
    busNumber: '100',
    tripId: 'v1',
    driver: 'John',
    latitude: 10,
    longitude: 10,
    adherence: 0,
    heartbeat: new Date(),
    routeName: 'Route 1',
    headsign: 'Downtown',
  };

  test('should only update existing vehicles without removing others', () => {
    // Initial state with two vehicles
    const initialState = {
      vehicles: {
        '100': initialVehicle,
        '200': { ...initialVehicle, busNumber: '200' },
      },
      loading: false,
    };

    // Update for vehicle 100 only
    const updatedVehicle = {
      ...initialVehicle,
      latitude: 20,
      longitude: 20,
    };

    const action = updateVehicles({ vehicles: [updatedVehicle] });
    const state = vehiclesReducer(initialState, action);

    // Assert that vehicle '100' is updated as expected
    expect(state.vehicles['100'].latitude).toBe(20);
    expect(state.vehicles['100'].longitude).toBe(20);

    // Assert that vehicle '200' remains unchanged (i.e., no goofy accidental modifications)
    expect(state.vehicles['200']).toEqual(initialState.vehicles['200']);

    // Also, confirm that no extra vehicles were removed or added
    expect(Object.keys(state.vehicles)).toHaveLength(Object.keys(initialState.vehicles).length);
  });

  test('should handle empty updates without modifying state', () => {
    const initialState = {
      vehicles: { '100': initialVehicle },
      loading: false,
    };

    const action = updateVehicles({ vehicles: [] });
    const state = vehiclesReducer(initialState, action);

    expect(state).toEqual(initialState);
  });
});
