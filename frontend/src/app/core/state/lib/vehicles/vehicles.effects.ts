import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as VehiclesActions from './vehicles.actions';
import * as WebSocket from '../websocket/websocket.actions';
import { catchError, map, mergeMap, of } from 'rxjs';
import { Vehicle } from '../../../utils/global.types';
import { HttpClient } from '@angular/common/http';
import { getBaseUrl } from '../../../utils/utils';

@Injectable()
export class VehiclesEffects {
  private vehiclesLink = `${getBaseUrl()}/api/vehicles`;

  constructor(private actions$: Actions, private http: HttpClient) {}

  loadVehicles$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(VehiclesActions.loadVehicles),
      mergeMap(() =>
        this.http.get<{ data: Vehicle[] }>(this.vehiclesLink).pipe(
          map((response) => {
            return VehiclesActions.loadVehiclesSuccess({
              vehicles: response.data,
            });
          }),
          catchError((error) => of(VehiclesActions.loadVehiclesFailure({ error: error.message })))
        )
      )
    );
  });

  listenForVehicleUpdates$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WebSocket.websocketVehiclesUpdateMessageReceived),
      map(({ vehicles }) => {
        return VehiclesActions.updateVehiclesSuccess({ vehicles });
      }),
      catchError((error) => of(VehiclesActions.loadVehiclesFailure({ error: error.message })))
    );
  });
}
