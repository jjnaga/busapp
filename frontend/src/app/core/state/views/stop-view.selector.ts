import { createSelector } from '@ngrx/store';
import { selectAllStopsSortedByDistance } from '../lib/stops/stops.selectors';
import { selectStopPreferences } from '../lib/user/user.selectors';
import { selectAllFavoriteEntities } from '../lib/favorites/favorites.selectors';

export const selectStopsSortedWithFavoritesAndPreferences = createSelector(
  selectAllStopsSortedByDistance,
  selectStopPreferences,
  selectAllFavoriteEntities,
  (stops, preferences, favoriteIds) => {
    // console.log('Stops:', stops);
    // console.log('Preferences:', preferences);
    // console.log('FavoriteIds:', favoriteIds);

    // Apply user preferences (custom names) to stops.
    const stopsWithPrefs = stops.map((stop) => ({
      ...stop,
      stopName: preferences[stop.stopId]?.customName || stop.stopName,
    }));
    // Split stops into favorites and non-favorites.
    const favorites = stopsWithPrefs.filter((stop) => favoriteIds[stop.stopId]);
    const nonFavorites = stopsWithPrefs.filter((stop) => !favoriteIds[stop.stopId]);
    // Combine with favorites on top.
    return [...favorites, ...nonFavorites];
  }
);
