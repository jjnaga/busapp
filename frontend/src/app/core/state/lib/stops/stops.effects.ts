import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as StopsActions from './stops.actions';
import { Stop, StopApiResponse, StopApiResponseSchema } from '../../../utils/global.types';
import { catchError, from, map, mergeMap, of, forkJoin, toArray, withLatestFrom } from 'rxjs';
import { getBaseUrl } from '../../../utils/utils';
import { parse } from 'date-fns';
import { selectStopsState } from './stops.selectors';
import { Store } from '@ngrx/store';
import { stopsAdapter } from './stops.reducers';

@Injectable()
export class StopsEffects {
  private detailedStopLink = (stopNumber: string) => `${getBaseUrl()}/api/stops/${stopNumber}`;

  private stopsLink = `${getBaseUrl()}/api/stops`;
  private store = inject(Store);
  private actions$ = inject(Actions);
  private http = inject(HttpClient);

  loadStops$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StopsActions.loadStops),
      mergeMap(() =>
        this.http.get<{ data: Stop[] }>(this.stopsLink).pipe(
          map((response) => {
            const cleanedStops = response.data.map((stop: Stop) => this.cleanStop(stop));

            return StopsActions.loadStopsSuccess({ stops: cleanedStops });
          }),
          catchError((error) => of(StopsActions.loadStopsFailure({ error: error.message })))
        )
      )
    );
  });

  loadDetailedStop$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StopsActions.loadDetailedStops),
      withLatestFrom(this.store.select(selectStopsState)),
      mergeMap(([{ stopIds }, stopsState]) => {
        const chunks = this.chunkArray(stopIds, 5);
        return from(chunks).pipe(
          mergeMap((chunk) =>
            forkJoin(
              chunk.map((stopId) =>
                this.http.get<{ data: StopApiResponse }>(this.detailedStopLink(stopId)).pipe(
                  map((response) => {
                    const parseResult = StopApiResponseSchema.safeParse(response.data);
                    if (!parseResult.success) {
                      return { error: 'Zod: Invalid API response', stopId };
                    }

                    const stop = stopsState.entities[stopId];
                    if (!stop) {
                      return { error: 'Stop not found', stopId };
                    }

                    return {
                      ...stop,
                      arrivals: parseResult.data.arrivals.map((arrival) => ({
                        ...arrival,
                        arrivalDate: parse(`${arrival.date} ${arrival.stopTime}`, 'M/d/yyyy h:mm a', new Date()),
                      })),
                      lastUpdated: new Date(),
                    };
                  }),
                  catchError((error) => of({ error: error.message, stopId }))
                )
              )
            ).pipe(
              // Process each batch immediately
              map((results) => {
                const errors = results.filter((result) => 'error' in result);
                const successfulStops = results.filter((result) => !('error' in result)) as Stop[];

                if (errors.length > 0) {
                  return StopsActions.loadDetailedStopsFailure({ error: errors });
                }
                return StopsActions.loadDetailedStopsSuccess({ stopIds: successfulStops });
              })
            )
          )
        );
      })
    )
  );

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private cleanStop(stop: Stop): Stop {
    return stop;
  }
}
