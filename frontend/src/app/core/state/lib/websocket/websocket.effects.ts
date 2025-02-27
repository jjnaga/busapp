import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as WebsocketActions from './websocket.actions';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { WebsocketService } from '../../../services/websocket.service';
import { VehicleArraySchema } from '../../../utils/global.types';

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
                const parseResults = VehicleArraySchema.safeParse(data);

                if (!parseResults.success) {
                  const errorDetails = JSON.stringify(parseResults.error.format(), null, 2);
                  return WebsocketActions.websocketError({
                    error: {
                      message: 'Invalid vehicle data',
                      details: errorDetails,
                    },
                  });
                }

                return WebsocketActions.websocketVehiclesUpdateMessageReceived({
                  vehicles: parseResults.data,
                });

              default:
                return { type: 'NO_ACTION' };
            }
          }),
          catchError((error) => {
            console.error('WebSocket error:', error);
            return of(
              WebsocketActions.websocketError({
                error: {
                  message: error.message || 'Unknown WebSocket error',
                  details: error.stack || 'No stack trace available',
                },
              })
            );
          })
        )
      )
    )
  );

  constructor(private actions$: Actions, private websocketService: WebsocketService) {}
}
