import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import * as FavoritesActions from './favorites.actions';

export interface FavoritesState extends EntityState<string> {} // Store only stopIds

export const adapter: EntityAdapter<string> = createEntityAdapter<string>({
  selectId: (stopId: string) => stopId,
});

export const initialState: FavoritesState = adapter.getInitialState();

export const favoritesReducer = createReducer(
  initialState,
  on(FavoritesActions.toggleFavoriteAction, (state, { stop }) => {
    return state.entities[stop.stopId] ? adapter.removeOne(stop.stopId, state) : adapter.addOne(stop.stopId, state);
  })
);

export const { selectAll, selectIds, selectEntities, selectTotal } = adapter.getSelectors();
