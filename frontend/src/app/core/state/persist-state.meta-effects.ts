import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { withLatestFrom, filter, mergeMap, startWith } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as UserActions from './lib/user/user.actions';
import { selectSelectedStop } from './lib/stops/stops.selectors';
import { selectSelectedVehicle } from './lib/user/user.selectors';

@Injectable()
export class UserInitEffects {
  constructor(private actions$: Actions, private store: Store) {}

  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType('@ngrx/store/init'),
      withLatestFrom(
        this.store.select(selectSelectedStop),
        this.store.select(selectSelectedVehicle).pipe(startWith(null))
      ),
      // Make sure a stop exists; vehicle is optional.
      filter(([_, selectedStop]) => !!selectedStop),
      mergeMap(([_, selectedStop, selectedVehicle]) => {
        // Build list of actions to dispatch
        const actionsToDispatch: (
          | ReturnType<typeof UserActions.setSelectedStop>
          | ReturnType<typeof UserActions.setSelectedVehicle>
        )[] = [UserActions.setSelectedStop({ stop: selectedStop! })];

        if (selectedVehicle !== null) {
          actionsToDispatch.push(UserActions.setSelectedVehicle({ vehicleId: selectedVehicle }));
        }

        return actionsToDispatch;
      })
    )
  );
}
