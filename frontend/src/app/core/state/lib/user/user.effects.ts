import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { mergeMap, of } from 'rxjs';
import { DrawerMode } from '../../../utils/global.types';
import { HttpClient } from '@angular/common/http';
import { getBaseUrl } from '../../../utils/utils';
import * as UserActions from './user.actions';
import { MapControllerService } from '../../../services/maps/map-controller.service';
import { DirectorService } from '../../../services/director.service';

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
        // let the user close it out
        // } else {
        //   return [UserActions.toggleDrawerExpanded({ expanded: false })];
        // }
      })
    )
  );
}
