import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, map } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faX, faLocationDot } from '@fortawesome/free-solid-svg-icons';

import { Stop } from '../../../../core/utils/global.types';
import {
  selectAllStopsSortedByDistance,
  selectNearbyStops,
  selectFavoritesWithLiveData,
} from '../../../../core/state/lib/stops/stops.selectors';
import { selectUserLocation } from '../../../../core/state/lib/user-location/user-location.selectors';
import { toggleFavoriteAction } from '../../../../core/state/lib/favorites/favorites.actions';
import { setSelectedStop } from '../../../../core/state/lib/user/user.actions';
import { DiffMinutesPipe } from '../../../../core/utils/pipes/diff-minutes.pipe';
import { StopNameComponent } from '../../../../shared/stop-name/stop-name.component';

@Component({
  selector: 'drawer-home',
  templateUrl: './home.component.html',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, DiffMinutesPipe, StopNameComponent],
})
export class HomeComponent implements OnInit, OnDestroy {
  private store = inject(Store);

  faX = faX;
  faLocationDot = faLocationDot;

  favorites$ = this.store.select(selectFavoritesWithLiveData);
  allStopsSortedByDistance$ = this.store.select(selectAllStopsSortedByDistance);
  userLocation$ = this.store.select(selectUserLocation);

  // Track favorite IDs for easy lookup
  favoriteIds$ = this.favorites$.pipe(map((favorites) => new Set(favorites.map((f) => f.stopId))));

  // Use the global nearby stops selector instead of local computation
  nearbyStops$ = this.store.select(selectNearbyStops);

  // Other favorites not shown in nearby section
  otherFavorites$ = combineLatest([this.favorites$, this.nearbyStops$]).pipe(
    map(([allFavorites, nearbyStops]) => {
      const nearbyStopIds = new Set(nearbyStops.map((stop) => stop.stopId));
      return allFavorites.filter((fav) => !nearbyStopIds.has(fav.stopId));
    })
  );

  ngOnInit(): void {
    // The nearby stops tracking is now handled automatically by the NgRx effect
    // No manual subscription management needed
  }

  ngOnDestroy(): void {
    // No subscriptions to clean up since we're using async pipe
  }

  setSelectedStop(stop: Stop): void {
    this.store.dispatch(setSelectedStop({ stop }));
  }

  toggleFavorite(stop: Stop, event: Event): void {
    event.stopPropagation();
    this.store.dispatch(toggleFavoriteAction({ stop }));
  }

  getNextArrivals(stop: Stop, limit: number = 3) {
    if (!stop.arrivals) return [];
    return stop.arrivals.slice(0, limit);
  }
}
