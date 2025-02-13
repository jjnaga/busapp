import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FavoritesState, selectAll } from './favorites.reducer';

export const selectFavoritesState = createFeatureSelector<FavoritesState>('favorites');

export const selectAllFavorites = createSelector(selectFavoritesState, selectAll);
