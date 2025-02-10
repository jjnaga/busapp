import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, filter, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DetailedStop, SelectedStop, Stop } from '../../../../core/utils/global.types';
import { selectAllStops, selectStopsLoading } from '../../../../core/state/lib/stops/stops.selectors';
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
  }

  ngOnInit() {
    // Build the sortedStops$ observable by combining user location and stops
    this.sortedStops$ = combineLatest([
      this.store
        .select(selectUserLocation)
        .pipe(filter((loc) => !!loc && loc.latitude !== null && loc.longitude !== null)),
      this.stops$,
    ]).pipe(
      map(([userLoc, stops]) => {
        return stops
          .filter((stop) => stop.stopLat !== null && stop.stopLon !== null)
          .slice() // create a copy
          .sort((a, b) => {
            const distA = this.calcDistance(userLoc.latitude!, userLoc.longitude!, a.stopLat!, a.stopLon!);
            const distB = this.calcDistance(userLoc.latitude!, userLoc.longitude!, b.stopLat!, b.stopLon!);
            return distA - distB;
          });
      })
    );

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

  // Haversine formula to compute distance (in meters)
  private calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
