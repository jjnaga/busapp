import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, filter, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DetailedStop, SelectedStop, Stop } from '../../../../core/utils/global.types';
import {
  selectAllStops,
  selectAllStopsSortedByDistance,
  selectStopsLoading,
} from '../../../../core/state/lib/stops/stops.selectors';
import { selectDrawerExpanded, selectSelectedStop } from '../../../../core/state/lib/user/user.selectors';
import { setSelectedStop } from '../../../../core/state/lib/user/user.actions';
import { DiffMinutesPipe } from '../../../../core/utils/pipes/diff-minutes.pipe';
import { selectUserLocation } from '../../../../core/state/lib/user-location/user-location.selectors';

@Component({
  selector: 'drawer-stops',
  templateUrl: './stops.component.html',
  imports: [CommonModule, DiffMinutesPipe],
  standalone: true,
})
export class StopsComponent implements OnInit {
  drawerExpanded$ = this.store.select(selectDrawerExpanded);
  stops$: Observable<Stop[]>; // original stops observable
  stopsLoading$: Observable<boolean>;
  selectedStop$: Observable<SelectedStop>;

  // New sorted observable combining user location & stops
  sortedStops$!: Observable<Stop[]>;

  // For next/previous navigation
  stopsArray: Stop[] = [];
  currentStopIndex: number = 0;

  constructor(private store: Store) {
    this.stops$ = this.store.select(selectAllStops);
    this.stopsLoading$ = this.store.select(selectStopsLoading);
    this.selectedStop$ = this.store.select(selectSelectedStop);
    this.sortedStops$ = this.store.select(selectAllStopsSortedByDistance);
  }

  ngOnInit() {
    // Subscribe to update stopsArray for navigation (if needed)
    this.sortedStops$.subscribe((sortedStops) => {
      this.stopsArray = sortedStops;
    });

    // Update index if user clicks a stop directly
    this.selectedStop$.subscribe((selected) => {
      if (selected) {
        const idx = this.stopsArray.findIndex((stop) => stop.stopId === selected.stopId);
        if (idx >= 0) {
          this.currentStopIndex = idx;
        }
      }
    });
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
