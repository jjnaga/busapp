import { Injectable } from '@angular/core';
import { VehiclesEffects } from './lib/vehicles/vehicles.effects';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as VehiclesActions from './lib/vehicles/vehicles.actions';

import { appInit } from './root.actions';
import { mergeMap } from 'rxjs';

@Injectable()
export class RootEffects {
  appInit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(appInit),
      mergeMap(() => [VehiclesActions.loadVehicles()])
    )
  );
  constructor(private actions$: Actions) {}
}

export const rootEffects = [RootEffects, VehiclesEffects];
