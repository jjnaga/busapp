import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FavoritesState, selectAll, selectEntities } from './favorites.reducer';
import { selectAllStops } from '../stops/stops.selectors';
import { Stop } from '../../../utils/global.types';

export const selectFavoritesState = createFeatureSelector<FavoritesState>('favorites');

export const selectAllFavoriteEntities = createSelector(selectFavoritesState, selectEntities);
export const selectAllFavoriteIds = createSelector(selectFavoritesState, selectAll);

export const selectIsFavorite = (stopId: string) =>
  createSelector(selectFavoritesState, (state) => state.entities[stopId] !== undefined);

export const selectFavoritesWithLiveData = createSelector(
  selectAllFavoriteIds,
  selectAllStops,
  (favoriteIds, stops) => {
    return favoriteIds.map((stopId) => stops[stopId]).filter((stop): stop is Stop => !!stop);
  }
);
