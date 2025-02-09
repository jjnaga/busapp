import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { DetailedStop, Stop, StopApiResponse, StopApiResponseSchema } from '../../../utils/global.types';
import { HttpClient } from '@angular/common/http';
import { getBaseUrl } from '../../../utils/utils';
import * as UserActions from './user.actions';
import { z } from 'zod';
import { parse } from 'date-fns';

@Injectable()
export class UserEffects {
  private selectedStopLink = (stopNumber: string) => `${getBaseUrl()}/api/stops/${stopNumber}`;

  constructor(private actions$: Actions, private http: HttpClient) {}

  setSelectedStop$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.setSelectedStop),
      mergeMap((action) =>
        this.http
          .get<{
            data: StopApiResponse;
          }>(this.selectedStopLink(action.stop.stopCode))
          .pipe(
            map((response) => {
              const parseResult = StopApiResponseSchema.safeParse(response.data);

              if (!parseResult.success) {
                return UserActions.updateSelectedStopFailure({
                  error: 'Zod: Invalid API response',
                });
              }

              // Set date for each arrival
              parseResult.data.arrivals.forEach((arrival) => {
                arrival.arrivalDate = parse(`${arrival.date} ${arrival.stopTime}`, 'M/d/yyyy h:mm a', new Date());
              });

              const stop = {
                ...action.stop,
                arrivals: parseResult.data.arrivals,
                lastUpdated: parseResult.data.timestamp,
              } as DetailedStop;
              console.log('huh??', stop);

              return UserActions.updateSelectedStop({
                stop: {
                  ...action.stop,
                  arrivals: parseResult.data.arrivals,
                  lastUpdated: parseResult.data.timestamp,
                } as DetailedStop,
              });
            }),
            catchError((error) => of(UserActions.updateSelectedStopFailure({ error: error.message })))
          )
      )
    )
  );

  toggleDrawerOnSelectedStop$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.setSelectedStop),
      map(() => UserActions.toggleDrawerExpanded({ expanded: true }))
    )
  );
}
