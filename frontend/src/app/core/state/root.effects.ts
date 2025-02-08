import { Injectable } from '@angular/core';
import { VehiclesEffects } from './lib/vehicles/vehicles.effects';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as VehiclesActions from './lib/vehicles/vehicles.actions';
import * as StopsActions from './lib/stops/stops.actions';

import { appInit } from './root.actions';
import { mergeMap } from 'rxjs';
import { StopsEffects } from './lib/stops/stops.effects';
import { UserEffects } from './lib/user/user.effects';

@Injectable()
export class RootEffects {
  appInit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(appInit),
      mergeMap(() => [VehiclesActions.loadVehicles(), StopsActions.loadStops()]),
    ),
  );
  constructor(private actions$: Actions) {}
}

export const rootEffects = [RootEffects, VehiclesEffects, StopsEffects, UserEffects];
