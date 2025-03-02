import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { mergeMap, of, filter } from 'rxjs';
import { DrawerMode } from '../../../utils/global.types';
import { HttpClient } from '@angular/common/http';
import { getBaseUrl } from '../../../utils/utils';
import * as UserActions from './user.actions';
import { MapControllerService } from '../../../services/maps/map-controller.service';
import { DirectorService } from '../../../services/director.service';
import * as VehicleActions from '../vehicles/vehicles.actions';

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private directorService = inject(DirectorService);

  toggleDrawerOnSelectedStop$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.setSelectedStop),
      mergeMap(({ stop }) => {
        if (stop) {
          this.directorService.setSelectedStopMode();
          return of(UserActions.setDrawerMode({ drawerMode: DrawerMode.Stops }));
        }

        return of({
          type: 'NOOP',
        });
      })
    )
  );

  // New effect to handle vehicle selection
  handleSelectedVehicle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.setSelectedVehicle),
      mergeMap(({ vehicleId }) => {
        if (vehicleId) {
          // Switch to vehicle mode - modify this based on your camera modes
          this.directorService.setIncomingBusMode(); // Using incoming bus mode for vehicles

          // Load vehicle shape - this will trigger the route shape loading
          return of(VehicleActions.loadVehicleShape({ vehicleId }));
        }

        // If vehicle selection is cleared, return to free form mode
        this.directorService.setFreeFormMode();
        return of({
          type: 'NOOP',
        });
      })
    )
  );
}
