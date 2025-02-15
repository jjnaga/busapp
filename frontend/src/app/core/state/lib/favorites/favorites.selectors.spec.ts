import { selectIsFavorite } from './favorites.selectors';

describe('Favorites Selectors', () => {
  const mockState = {
    favorites: {
      ids: ['1'],
      entities: { '1': { stopId: '1' } },
    },
  };

  test('selectIsFavorite should return true for existing favorite', () => {
    const result = selectIsFavorite('1')(mockState);
    expect(result).toBe(true);
  });

  test('selectIsFavorite should return false for non-existent favorite', () => {
    const result = selectIsFavorite('2')(mockState);
    expect(result).toBe(false);
  });
});
