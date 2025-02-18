// stops.reducer.spec.ts
import { stopsReducer, initialStopsState } from './stops.reducers';
import { loadStopsSuccess, loadStopsFailure } from './stops.actions';
import { Stop } from '../../../utils/global.types';

describe('Stops Reducer', () => {
  test('should update stops and set loading to false on success', () => {
    const stops: Stop[] = [
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
    expect(state.entities['1']).toEqual(stops[0]);
    expect(state.loading).toBe(false);
  });

  test('should set loading to false on failure', () => {
    const action = loadStopsFailure({ error: 'Error' });
    const state = stopsReducer(initialStopsState, action);
    expect(state.loading).toBe(false);
  });
});
