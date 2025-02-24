import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { mergeMap, of } from 'rxjs';
import { DrawerMode } from '../../../utils/global.types';
import { HttpClient } from '@angular/common/http';
import { getBaseUrl } from '../../../utils/utils';
import * as UserActions from './user.actions';

@Injectable()
export class UserEffects {
  constructor(private actions$: Actions, private http: HttpClient) {}
  toggleDrawerOnSelectedStop$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.setSelectedStop),
      mergeMap(({ stop }) => {
        if (stop) {
          return [
            UserActions.toggleDrawerExpanded({ expanded: true }),
            UserActions.setDrawerMode({ drawerMode: DrawerMode.Stops }),
            UserActions.setSelectedArrival({ arrivalIndex: 0 }),
          ];
        }

        return of({
          type: 'NOOP',
        });
        // let the user close it out
        // } else {
        //   return [UserActions.toggleDrawerExpanded({ expanded: false })];
        // }
      })
    )
  );
}
