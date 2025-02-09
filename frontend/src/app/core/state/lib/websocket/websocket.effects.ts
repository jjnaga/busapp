import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as WebsocketActions from './websocket.actions';
import * as VehiclesActions from '../vehicles/vehicles.actions';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { WebsocketService } from '../../../services/websocket.service';

@Injectable()
export class WebsocketEffects {
  initiateWebsocketConnection$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(WebsocketActions.connectWebsocket),
        tap(() => this.websocketService.connect())
      ),
    { dispatch: false }
  );

  listenForMessages$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WebsocketActions.websocketConnected),
      switchMap(() =>
        this.websocketService.getMessages().pipe(
          map((message) => {
            const { type, data } = message;

            switch (type) {
              case 'vehicleUpdate':
                return WebsocketActions.websocketVehiclesUpdateMessageReceived({ vehicles: data });

              default:
                return { type: 'NO_ACTION' };
            }
          }),
          catchError((error) => of(WebsocketActions.websocketError({ error })))
        )
      )
    )
  );

  vehiclesUpdateMessageReceived$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WebsocketActions.websocketVehiclesUpdateMessageReceived),
      map(({ vehicles }) => {
        console.log('this working', vehicles);
        return VehiclesActions.updateVehicles({ vehicles });
      })
    )
  );

  constructor(private actions$: Actions, private websocketService: WebsocketService) {}
}
