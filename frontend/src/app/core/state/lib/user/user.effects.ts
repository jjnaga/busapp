import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { mergeMap } from 'rxjs';
import { DrawerMode } from '../../../utils/global.types';
import { HttpClient } from '@angular/common/http';
import { getBaseUrl } from '../../../utils/utils';
import * as UserActions from './user.actions';

@Injectable()
export class UserEffects {
  private selectedStopLink = (stopNumber: string) => `${getBaseUrl()}/api/stops/${stopNumber}`;

  constructor(private actions$: Actions, private http: HttpClient) {}
  toggleDrawerOnSelectedStop$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.setSelectedStop),
      mergeMap(({ stop }) => {
        if (stop) {
          return [
            UserActions.toggleDrawerExpanded({ expanded: true }),
            UserActions.setDrawerMode({ drawerMode: DrawerMode.Stops }),
          ];
        } else {
          return [UserActions.toggleDrawerExpanded({ expanded: false })];
        }
      })
    )
  );
}
