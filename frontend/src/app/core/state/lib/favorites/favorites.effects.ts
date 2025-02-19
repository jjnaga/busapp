import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { appInit } from '../../root.actions';
import * as FavoritesActions from './favorites.actions';
import * as StopsActions from '../stops/stops.actions';
import { withLatestFrom, map } from 'rxjs/operators';
import { selectAllFavoriteEntities, selectAllFavoriteIds } from './favorites.selectors';

@Injectable()
export class FavoritesEffects {
  // When the app initializes, grab any stored favorites and add them to trackingStops.
  onInitLoadFavoritesToTracking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(appInit),
      withLatestFrom(this.store.select(selectAllFavoriteIds)),
      map(([_, favoritesIds]) => {
        if (favoritesIds && favoritesIds.length > 0) {
          console.log('wtf', favoritesIds);
          return StopsActions.startTrackingStops({ stopIds: favoritesIds });
        } else {
          return { type: 'NO_ACTION' };
        }
      })
    )
  );

  toggleFavorite$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FavoritesActions.toggleFavoriteAction),
      withLatestFrom(this.store.select(selectAllFavoriteEntities)),
      map(([toggledStop, favorites]) => {
        if (toggledStop.stop.stopId in favorites) {
          return StopsActions.stopTrackingStops({ stopIds: [toggledStop.stop.stopId] });
        } else {
          return StopsActions.startTrackingStops({ stopIds: [toggledStop.stop.stopId] });
        }
      })
    )
  );

  constructor(private actions$: Actions, private store: Store) {}
}
