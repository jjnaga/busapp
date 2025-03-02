// vehicles.reducers.spec.ts (updated)
import { vehiclesReducer, VehiclesState } from './vehicles.reducers';
import { updateVehicles } from './vehicles.actions';
import { Vehicle } from '../../../utils/global.types';

describe('Vehicles Reducer', () => {
  const initialVehicle: Vehicle = {
    busNumber: '100',
    tripId: 2,
    driver: 'John',
    latitude: 10,
    longitude: 10,
    adherence: 0,
    heartbeat: new Date(),
    routeName: 'Route 1',
    headsign: 'Downtown',
  };

  test('should only update existing vehicles without removing others', () => {
    // Create an initial state using the entity shape
    const initialState: VehiclesState = {
      ids: ['100', '200'],
      entities: {
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
    expect(state.entities['100']!.latitude).toBe(20);
    expect(state.entities['100']!.longitude).toBe(20);

    // Assert that vehicle '200' remains unchanged (no goofy accidental modifications)
    expect(state.entities['200']).toEqual(initialState.entities['200']);

    // Also, confirm that no extra vehicles were removed or added
    expect(state.ids).toHaveLength(initialState.ids.length);
  });

  test('should handle empty updates without modifying state', () => {
    const initialState: VehiclesState = {
      ids: ['100'],
      entities: { '100': initialVehicle },
      loading: false,
    };

    const action = updateVehicles({ vehicles: [] });
    const state = vehiclesReducer(initialState, action);

    expect(state).toEqual(initialState);
  });
});
