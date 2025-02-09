// stops.reducer.spec.ts
import { stopsReducer, initialStopsState } from './stops.reducers';
import { loadStopsSuccess, loadStopsFailure } from './stops.actions';

describe('Stops Reducer', () => {
  test('should update stops and set loading to false on success', () => {
    const stops = [
      {
        stopId: '1',
        stopCode: '1',
        stopName: 'Stop 1',
        stopLat: 10,
        stopLon: 10,
        stopUrl: null,
        stopSerialNumber: null,
      },
    ];
    const action = loadStopsSuccess({ stops });
    const state = stopsReducer(initialStopsState, action);
    expect(state.stops).toEqual(stops);
    expect(state.loading).toBe(false);
  });

  test('should set loading to false on failure', () => {
    const action = loadStopsFailure({ error: 'Error' });
    const state = stopsReducer(initialStopsState, action);
    expect(state.loading).toBe(false);
  });
});
