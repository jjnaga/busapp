import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as StopsActions from './stops.actions';
import * as UserActions from '../user/user.actions';
import { Stop, StopApiResponse, StopApiResponseSchema } from '../../../utils/global.types';
import {
  catchError,
  from,
  map,
  mergeMap,
  of,
  forkJoin,
  switchMap,
  distinctUntilChanged,
  filter,
  take,
  concatMap,
  withLatestFrom,
} from 'rxjs';
import { getBaseUrl } from '../../../utils/utils';
import { parse } from 'date-fns';
import {
  selectAllStopsSortedByDistance,
  selectAllStops,
  selectStopsTrackingValues,
  selectSelectedStop,
} from './stops.selectors';
import { Store } from '@ngrx/store';
import { timer, EMPTY } from 'rxjs';
import { appInit } from '../../root.actions';

@Injectable()
export class StopsEffects {
  private detailedStopLink = (stopNumber: string) => `${getBaseUrl()}/api/stops/${stopNumber}`;
  private stopsLink = `${getBaseUrl()}/api/stops`;
  private store = inject(Store);
  private actions$ = inject(Actions);
  private http = inject(HttpClient);

  // When the app initializes, if there's a stored selectedStop, add it to trackingStops.
  loadSelectedStopToTracking$ = createEffect(() => {
    const selectedStop$ = this.store.select(selectSelectedStop).pipe(
      filter((stop): stop is Stop => stop !== undefined),
      take(1)
    );

    return this.actions$.pipe(
      ofType(appInit),
      mergeMap(() =>
        selectedStop$.pipe(map((selectedStop) => StopsActions.startTrackingStops({ stopIds: [selectedStop.stopId] })))
      )
    );
  });

  loadStops$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StopsActions.loadStops),
      mergeMap(() =>
        this.http.get<{ data: Stop[] }>(this.stopsLink).pipe(
          map((response) => {
            return [StopsActions.loadStopsSuccess({ stops: response.data })];
          }),
          mergeMap((actions) => from(actions)),
          catchError((error) => of(StopsActions.loadStopsFailure({ error: error.message })))
        )
      )
    )
  );

  loadDetailedStops$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StopsActions.loadDetailedStops),
      // Wait until stops data is loaded
      concatMap((action) =>
        this.store.select(selectAllStops).pipe(
          filter((stops) => Object.keys(stops).length > 0),
          take(1),
          map((stopsDict) => ({ action, stopsDict }))
        )
      ),
      mergeMap(({ action, stopsDict }) => {
        const filteredStops = action.stopIds.filter((id) => !!stopsDict[id]);
        const chunks = this.chunkArray(filteredStops, 5);
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
                    const stopEntity = stopsDict[stopId];
                    if (!stopEntity) {
                      return { error: 'Stop not found', stopId };
                    }
                    const stop: Stop = {
                      ...stopEntity,
                      arrivals: parseResult.data.arrivals.map((arrival) => ({
                        ...arrival,
                        arrivalDate: parse(`${arrival.date} ${arrival.stopTime}`, 'M/d/yyyy h:mm a', new Date()),
                      })),
                      lastUpdated: new Date(),
                    };
                    return stop;
                  }),
                  catchError((error) => of({ error: error.message, stopId }))
                )
              )
            ).pipe(
              map((results) => {
                const errors = results.filter(
                  (result): result is { error: string; stopId: string } => 'error' in result
                );
                const successfulStops = results.filter((result): result is Stop => !('error' in result));
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
      switchMap((action) => {
        if (action.stop === null) {
          // If stop is null, return an empty observable
          return EMPTY;
        }

        return of(StopsActions.startTrackingStops({ stopIds: [action.stop.stopId] }));
      })
    )
  );

  // Effect: When stopsTracking changes, load detailed stops immediately and every 15 seconds.
  loadTrackedStops$ = createEffect(() =>
    this.store.select(selectStopsTrackingValues).pipe(
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
}
