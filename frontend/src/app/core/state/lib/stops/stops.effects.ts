import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as StopsActions from './stops.actions';
import { Stop } from '../../../utils/global.types';
import { catchError, map, mergeMap, of } from 'rxjs';
import { getBaseUrl } from '../../../utils/utils';

@Injectable()
export class StopsEffects {
  private stopsLink = `${getBaseUrl()}/api/stops`;

  constructor(private actions$: Actions, private http: HttpClient) {}

  loadStops$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StopsActions.loadStops),
      mergeMap(() =>
        this.http.get<{ data: Stop[] }>(this.stopsLink).pipe(
          map((response) => {
            const cleanedStops = response.data.map((stop: Stop) =>
              this.cleanStop(stop)
            );

            return StopsActions.loadStopsSuccess({ stops: cleanedStops });
          }),
          catchError((error) =>
            of(StopsActions.loadStopsFailure({ error: error.message }))
          )
        )
      )
    );
  });

  private cleanStop(stop: Stop): Stop {
    return stop;
  }
}
