import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as VehiclesActions from './vehicles.actions';
import * as WebSocket from '../websocket/websocket.actions';
import * as UserActions from '../user/user.actions';
import { catchError, map, mergeMap, of, filter, withLatestFrom } from 'rxjs';
import { RouteShape, Vehicle, VehicleShapeResponse } from '../../../utils/global.types';
import { HttpClient } from '@angular/common/http';
import { getBaseUrl } from '../../../utils/utils';
import { Store } from '@ngrx/store';
import { selectVehicleById } from './vehicles.selectors';

@Injectable()
export class VehiclesEffects {
  private vehiclesLink = `${getBaseUrl()}/api/vehicles`;

  constructor(private actions$: Actions, private http: HttpClient, private store: Store) {}

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

  // New effect to handle loading vehicle shape when a vehicle is selected
  loadVehicleShape$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(UserActions.setSelectedVehicle),
      filter(({ vehicleId }) => !!vehicleId), // Only proceed if a vehicle is actually selected (not null)
      withLatestFrom(this.store.select((state) => state)),
      mergeMap(([{ vehicleId }, state]) => {
        if (!vehicleId) throw new Error('Vehicle ID is null'); // TS cant know i guess from the filter

        // Get the vehicle from the store to check if it already has a shape
        const vehicle = selectVehicleById(vehicleId)(state);

        // If the vehicle already has a shape, don't make the API call
        if (vehicle?.routeShape) {
          return of(); // Return empty observable, no action dispatched
        }

        // Ensure vehicleId is padded with leading zeroes if needed
        // Some bus numbers might need to be padded (e.g., '42' -> '042')
        // This depends on how your backend expects the ID format
        const paddedVehicleId = vehicleId.padStart(3, '0');

        return this.http.get<VehicleShapeResponse>(`${this.vehiclesLink}/${paddedVehicleId}/shape`).pipe(
          map((response) => {
            // Transform the shape format for Google Maps (lon -> lng)
            const routeShape: RouteShape = response.data.shapes.map((point) => ({
              lat: point.lat,
              lng: point.lon, // Convert to the format expected by Google Maps
            }));

            return VehiclesActions.loadVehicleShapeSuccess({ vehicleId, routeShape });
          }),
          catchError((error) =>
            of(
              VehiclesActions.loadVehicleShapeFailure({
                vehicleId,
                error: error.message || 'Failed to load vehicle route shape',
              })
            )
          )
        );
      })
    );
  });
}
