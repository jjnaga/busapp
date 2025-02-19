import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { Stop } from '../../../../core/utils/global.types';
import { selectAllStopsSortedByDistance, selectStopsLoading } from '../../../../core/state/lib/stops/stops.selectors';
import { selectDrawerExpanded, selectSelectedStop } from '../../../../core/state/lib/user/user.selectors';
import { DiffMinutesPipe } from '../../../../core/utils/pipes/diff-minutes.pipe';
import { selectIsFavorite } from '../../../../core/state/lib/favorites/favorites.selectors';
import * as StopsActions from '../../../../core/state/lib/stops/stops.actions';
import * as UserActions from '../../../../core/state/lib/user/user.actions';
import * as FavoritesActions from '../../../../core/state/lib/favorites/favorites.actions';
import { selectIsMobile } from '../../../../core/state/lib/layout/layout.selectors';

@Component({
  selector: 'drawer-stops',
  templateUrl: './stops.component.html',
  standalone: true,
  imports: [CommonModule, DiffMinutesPipe],
})
export class StopsComponent implements OnInit {
  StopsActions = StopsActions;
  UserActions = UserActions;
  FavoritesActions = FavoritesActions;

  store = inject(Store);

  drawerExpanded$: Observable<boolean> = this.store.select(selectDrawerExpanded);
  stopsLoading$: Observable<boolean> = this.store.select(selectStopsLoading);
  selectedStop$: Observable<Stop | undefined> = this.store.select(selectSelectedStop);
  stopsSortedByDistance$: Observable<Stop[]> = this.store.select(selectAllStopsSortedByDistance);
  isMobile$ = this.store.select(selectIsMobile);

  // This observable will emit whether the current selected stop is a favorite.
  isFavorite$!: Observable<boolean>;

  ngOnInit(): void {
    // Whenever the selected stop changes, update the isFavorite$ observable.
    this.isFavorite$ = this.selectedStop$.pipe(
      filter((stop): stop is Stop => !!stop),
      switchMap((stop) => this.store.select(selectIsFavorite(stop.stopId)))
    );
  }
}
