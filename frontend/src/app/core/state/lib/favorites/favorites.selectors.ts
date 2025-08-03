import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FavoritesState, selectAll, selectEntities } from './favorites.reducer';

export const selectFavoritesState = createFeatureSelector<FavoritesState>('favorites');

export const selectAllFavoriteEntities = createSelector(selectFavoritesState, selectEntities);
export const selectAllFavoriteIds = createSelector(selectFavoritesState, selectAll);

export const selectIsFavorite = (stopId: string) =>
  createSelector(selectFavoritesState, (state) => state.entities[stopId] !== undefined);
