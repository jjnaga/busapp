import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as VehiclesActions from './vehicles.actions';
import { catchError, map, mergeMap, of } from 'rxjs';
import { Vehicle } from '../../../utils/global.types';
import { formatDistanceToNow } from 'date-fns';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class VehiclesEffects {
  private vehiclesLink = 'http://localhost:3000/api/vehicles';
  constructor(private actions$: Actions, private http: HttpClient) {}

  loadVehicles$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(VehiclesActions.loadVehicles),
      mergeMap(() =>
        this.http.get<{ data: Vehicle[] }>(this.vehiclesLink).pipe(
          map((response) => {
            const cleanedVehicles = response.data.map((vehicle: Vehicle) =>
              this.cleanVehicle(vehicle)
            );

            return VehiclesActions.loadVehiclesSuccess({
              vehicles: cleanedVehicles,
            });
          }),
          catchError((error) =>
            of(VehiclesActions.loadVehiclesFailure({ error: error.message }))
          )
        )
      )
    );
  });

  private cleanVehicle(vehicle: Vehicle): Vehicle {
    return vehicle;
    // return {
    //   ...vehicle,
    //   heartbeat: new Date(vehicle.heartbeat),
    //   heartbeatFormatted: formatDistanceToNow(vehicle.heartbeat, {
    //     addSuffix: true,
    //   }),
    // };
  }
}
