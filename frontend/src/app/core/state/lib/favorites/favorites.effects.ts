import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { appInit } from '../../root.actions';
import * as FavoritesActions from './favorites.actions';
import * as StopsActions from '../stops/stops.actions';
import { withLatestFrom, map } from 'rxjs/operators';
import { selectAllFavorites } from './favorites.selectors';

@Injectable()
export class FavoritesEffects {
  // When the app initializes, grab any stored favorites and add them to trackingStops.
  loadFavoritesToTracking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(appInit),
      withLatestFrom(this.store.select(selectAllFavorites)),
      map(([_, favorites]) => {
        if (favorites && favorites.length > 0) {
          return StopsActions.startTrackingStops({ stops: favorites });
        } else {
          return { type: 'NO_ACTION' };
        }
      })
    )
  );

  // When a favorite is toggled, update stops tracking accordingly.
  updateFavoritesTracking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FavoritesActions.toggleFavoriteAction),
      withLatestFrom(this.store.select(selectAllFavorites)),
      map(([action, favorites]) => {
        const isNowFavorite = favorites.some((fav) => fav.stopId === action.stop.stopId);
        if (isNowFavorite) {
          return StopsActions.startTrackingStops({ stops: [action.stop] });
        } else {
          return StopsActions.stopTrackingStops({ stopIds: [action.stop.stopId] });
        }
      })
    )
  );

  constructor(private actions$: Actions, private store: Store) {}
}
