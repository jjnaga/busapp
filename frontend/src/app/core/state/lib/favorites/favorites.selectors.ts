import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FavoritesState, selectAll, selectEntities } from './favorites.reducer';
import { selectAllStops, selectAllStopsSortedByDistance } from '../stops/stops.selectors';
import { Stop } from '../../../utils/global.types';

export const selectFavoritesState = createFeatureSelector<FavoritesState>('favorites');

export const selectAllFavoriteEntities = createSelector(selectFavoritesState, selectEntities);
export const selectAllFavoriteIds = createSelector(selectFavoritesState, selectAll);

export const selectIsFavorite = (stopId: string) =>
  createSelector(selectFavoritesState, (state) => state.entities[stopId] !== undefined);

// Previous implementation (doesn't work because stops is an array, not a dictionary)
// export const selectFavoritesWithLiveData = createSelector(
//   selectAllFavoriteIds,
//   selectAllStopsSortedByDistance,
//   (favoriteIds, stops) => {
//     return favoriteIds.map((stopId) => stops[stopId]).filter((stop): stop is Stop => !!stop);
//   }
// );

// New implementation - filter the already sorted stops to only include favorites
export const selectFavoritesWithLiveData = createSelector(
  selectAllFavoriteIds,
  selectAllStopsSortedByDistance,
  (favoriteIds, sortedStops) => {
    // Create a Set for O(1) lookups of favorite IDs
    const favoriteIdSet = new Set(favoriteIds);

    // Filter the already distance-sorted stops to only include favorites
    return sortedStops.filter((stop) => favoriteIdSet.has(stop.stopId));

    // This preserves the distance-based sorting while giving you only favorites
  }
);
