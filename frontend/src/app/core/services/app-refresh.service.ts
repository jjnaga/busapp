import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { DrawerMode } from '../utils/global.types';
import { fromEvent, merge } from 'rxjs';
import * as AppActions from '../state/lib/app/app.actions';
import * as UserActions from '../state/lib/user/user.actions';
import { DirectorService } from './director.service';

@Injectable({ providedIn: 'root' })
export class AppRefreshService {
  private store = inject(Store);
  private directorService = inject(DirectorService);
  private lastInvisibleTime: number | null = null;

  // Time thresholds for different behaviors
  private readonly SHORT_ABSENCE_THRESHOLD = 2000; // 2 seconds
  private readonly LONG_ABSENCE_THRESHOLD = 600000; // 10 minutes

  initialize(): void {
    // Detect visibility changes (tab/window focus, mobile app resuming)
    const visibilityChange$ = fromEvent(document, 'visibilitychange');
    const windowFocus$ = fromEvent(window, 'focus');

    // Combine both event streams
    merge(visibilityChange$, windowFocus$).subscribe(() => {
      if (document.visibilityState === 'visible') {
        this.handleAppReactivation();
      } else if (document.visibilityState === 'hidden') {
        this.lastInvisibleTime = Date.now();
      }
    });
  }

  private handleAppReactivation(): void {
    if (!this.lastInvisibleTime) {
      return; // First initialization or invalid state
    }

    const now = Date.now();
    const absenceDuration = now - this.lastInvisibleTime;

    // Reset the time tracker
    this.lastInvisibleTime = null;

    // Handle short absence (> 2 seconds)
    if (absenceDuration > this.SHORT_ABSENCE_THRESHOLD) {
      // Dispatch refresh action for data updates
      this.store.dispatch(AppActions.appWokeUp());
      console.log('App refreshed after', (absenceDuration / 1000).toFixed(1), 'seconds');

      // Handle long absence (> 10 minutes)
      if (absenceDuration > this.LONG_ABSENCE_THRESHOLD) {
        console.log('Long absence detected, resetting app state');

        // Reset selected state and UI
        this.store.dispatch(UserActions.setSelectedStop({ stop: null }));
        this.store.dispatch(UserActions.setSelectedVehicle({ vehicleId: null }));
        this.store.dispatch(UserActions.setDrawerMode({ drawerMode: 'favorites' as DrawerMode }));
        this.store.dispatch(UserActions.toggleDrawerExpanded({ expanded: true }));

        // go to user mode
        this.directorService.setUserMode();
      }
    }
  }
}
