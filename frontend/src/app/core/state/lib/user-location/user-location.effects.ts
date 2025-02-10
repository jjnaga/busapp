import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { mergeMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import * as LocationActions from './user-location.actions';
import { UserLocationService } from '../../../services/user-location.service';

@Injectable()
export class UserLocationEffects {
  trackLocation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LocationActions.startLocationTracking),
      mergeMap(() =>
        this.userLocationService.watchLocation().pipe(
          map((coords) =>
            LocationActions.userLocationUpdate({
              latitude: coords.latitude,
              longitude: coords.longitude,
            })
          ),
          catchError((error) => of(LocationActions.userLocationError({ error: error })))
        )
      )
    )
  );

  constructor(private actions$: Actions, private userLocationService: UserLocationService) {}
}
