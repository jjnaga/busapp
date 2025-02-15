import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, Observable, switchMap } from 'rxjs';
import { DetailedStop, SelectedStop, Stop } from '../../../../core/utils/global.types';
import {
  selectAllStops,
  selectAllStopsSortedByDistance,
  selectStopsLoading,
} from '../../../../core/state/lib/stops/stops.selectors';
import { selectDrawerExpanded, selectSelectedStop } from '../../../../core/state/lib/user/user.selectors';
import { setSelectedStop } from '../../../../core/state/lib/user/user.actions';
import { DiffMinutesPipe } from '../../../../core/utils/pipes/diff-minutes.pipe';
import { selectAllFavorites, selectIsFavorite } from '../../../../core/state/lib/favorites/favorites.selectors';
import { toggleFavoriteAction } from '../../../../core/state/lib/favorites/favorites.actions';
import { selectIsMobile } from '../../../../core/state/lib/layout/layout.selectors';

@Component({
  selector: 'drawer-stops',
  templateUrl: './stops.component.html',
  imports: [CommonModule, DiffMinutesPipe],
  standalone: true,
})
export class StopsComponent implements OnInit {
  constructor(private store: Store) {}
  drawerExpanded$ = this.store.select(selectDrawerExpanded);
  stops$: Observable<Stop[]> = this.store.select(selectAllStops);
  stopsLoading$: Observable<boolean> = this.store.select(selectStopsLoading);
  selectedStop$: Observable<SelectedStop> = this.store.select(selectSelectedStop);
  favorites$: Observable<Stop[]> = this.store.select(selectAllFavorites);
  sortedStops$: Observable<Stop[]> = this.store.select(selectAllStopsSortedByDistance);
  // New: track if we're on mobile
  isMobile$ = this.store.select(selectIsMobile);

  // local variables
  isFavorite$?: Observable<boolean>;
  stopsArray: Stop[] = [];
  currentStopIndex: number = 0;

  ngOnInit() {
    this.sortedStops$.subscribe((sortedStops) => {
      this.stopsArray = sortedStops;
    });

    this.selectedStop$.subscribe((selected) => {
      if (selected) {
        const idx = this.stopsArray.findIndex((stop) => stop.stopId === selected.stopId);
        if (idx >= 0) {
          this.currentStopIndex = idx;
        }
      }
    });

    // updates when either selected stop or favorites change
    this.isFavorite$ = this.selectedStop$.pipe(
      filter((stop): stop is Stop => !!stop),
      switchMap((stop) => this.store.select(selectIsFavorite(stop.stopId)))
    );
  }

  toggleFavorite(stop: Stop) {
    if (!stop) {
      console.error('toggleFavorites: stop is undefined');
      return;
    }
    this.store.dispatch(toggleFavoriteAction({ stop }));
  }

  setSelectedStop(stop: Stop | null) {
    this.store.dispatch(setSelectedStop({ stop }));
  }

  // Type guard for DetailedStop
  isDetailedStop(stop: SelectedStop): stop is DetailedStop {
    return stop !== null && 'lastUpdated' in stop;
  }

  goToNextStop() {
    if (!this.stopsArray.length) return;
    this.currentStopIndex = (this.currentStopIndex + 1) % this.stopsArray.length;
    this.store.dispatch(setSelectedStop({ stop: this.stopsArray[this.currentStopIndex] }));
  }

  goToPreviousStop() {
    if (!this.stopsArray.length) return;
    this.currentStopIndex = (this.currentStopIndex - 1 + this.stopsArray.length) % this.stopsArray.length;
    this.store.dispatch(setSelectedStop({ stop: this.stopsArray[this.currentStopIndex] }));
  }
}
