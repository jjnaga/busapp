import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import * as FavoritesActions from './favorites.actions';
import { Stop } from '../../../utils/global.types';

export interface FavoritesState extends EntityState<Stop> {}

export const adapter: EntityAdapter<Stop> = createEntityAdapter<Stop>({
  selectId: (stop: Stop) => stop.stopId,
});

export const initialState: FavoritesState = adapter.getInitialState();

export const favoritesReducer = createReducer(
  initialState,
  on(FavoritesActions.addFavorite, (state, { stop }) => adapter.addOne(stop, state)),
  on(FavoritesActions.removeFavorite, (state, { stopId }) => adapter.removeOne(stopId, state))
);

// Export selectors from the adapter.
export const { selectAll } = adapter.getSelectors();
