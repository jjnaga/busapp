import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as StopsActions from './stops.actions';
import * as UserActions from '../user/user.actions';
import { Stop, StopApiResponse, StopApiResponseSchema } from '../../../utils/global.types';
import { catchError, from, map, mergeMap, of, forkJoin, withLatestFrom, switchMap, distinctUntilChanged } from 'rxjs';
import { getBaseUrl } from '../../../utils/utils';
import { parse } from 'date-fns';
import { selectAllStopsSortedByDistance, selectStopsState, selectStopsTrackingIds } from './stops.selectors';
import { Store } from '@ngrx/store';
import { selectSelectedStop } from '../user/user.selectors';
import { timer, EMPTY } from 'rxjs';

@Injectable()
export class StopsEffects {
  private detailedStopLink = (stopNumber: string) => `${getBaseUrl()}/api/stops/${stopNumber}`;
  private stopsLink = `${getBaseUrl()}/api/stops`;
  private store = inject(Store);
  private actions$ = inject(Actions);
  private http = inject(HttpClient);

  loadStops$ = createEffect(() =>
    this.actions$.pipe(
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
    )
  );

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

  navigateStops$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StopsActions.nextStop, StopsActions.previousStop),
      withLatestFrom(this.store.select(selectAllStopsSortedByDistance), this.store.select(selectSelectedStop)),
      map(([action, stops, currentStop]) => {
        const currentIndex = stops.findIndex((s) => s.stopId === currentStop?.stopId) ?? -1;
        const newIndex =
          action.type === '[Stops] Next Stop'
            ? (currentIndex + 1) % stops.length
            : (currentIndex - 1 + stops.length) % stops.length;
        return UserActions.setSelectedStop({ stop: stops[newIndex] });
      })
    )
  );

  // Effect to update stopsTracking when the selected stop changes.
  updateStopsTrackingOnSelectedStop$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.setSelectedStop),
      withLatestFrom(this.store.select(selectStopsTrackingIds)),
      mergeMap(([action, trackedIds]) => {
        const actionsArray = [];
        if (trackedIds.length > 0) {
          // Remove any currently tracked stops.
          actionsArray.push(StopsActions.stopTrackingStops({ stopIds: trackedIds }));
        }
        if (action.stop) {
          // Add the newly selected stop to tracking.
          actionsArray.push(StopsActions.startTrackingStops({ stops: [action.stop] }));
        }
        return actionsArray;
      })
    )
  );

  // Effect: When stopsTracking changes, load detailed stops immediately and every 15 seconds.
  loadTrackedStops$ = createEffect(() =>
    this.store.select(selectStopsTrackingIds).pipe(
      distinctUntilChanged((prev, curr) => {
        return prev.length === curr.length && prev.every((id, index) => id === curr[index]);
      }),
      switchMap((stopIds) => {
        if (stopIds.length > 0) {
          return timer(0, 15000).pipe(map(() => StopsActions.loadDetailedStops({ stopIds })));
        } else {
          return EMPTY;
        }
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
