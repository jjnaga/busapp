import { favoritesReducer, initialState } from './favorites.reducer';
import { toggleFavoriteAction } from './favorites.actions';
import { Stop } from '../../../utils/global.types';

describe('Favorites Reducer', () => {
  const mockStop: Stop = {
    stopId: '1',
    stopCode: '001',
    stopName: 'Test Stop',
    stopLat: 10,
    stopLon: 20,
    stopUrl: null,
    stopSerialNumber: 1,
  };

  test('should add stop to favorites when not present', () => {
    const action = toggleFavoriteAction({ stop: mockStop });
    const state = favoritesReducer(initialState, action);
    expect(state.ids).toContain(mockStop.stopId);
    expect(state.entities[mockStop.stopId]).toEqual(mockStop);
  });

  test('should remove stop from favorites when present', () => {
    const initial = favoritesReducer(initialState, toggleFavoriteAction({ stop: mockStop }));
    const action = toggleFavoriteAction({ stop: mockStop });
    const state = favoritesReducer(initial, action);
    expect(state.ids).not.toContain(mockStop.stopId);
  });
});
