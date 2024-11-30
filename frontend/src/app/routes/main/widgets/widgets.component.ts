import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { StopsService } from '../../../core/services/stops.service';
import { combineLatest, map, Subject } from 'rxjs';
import { Stop } from '../../../core/utils/global.types';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChevronLeft,
  faLocationDot,
  faChevronRight,
  faStar,
  faSyncAlt,
} from '@fortawesome/free-solid-svg-icons';
import { UserDataService } from '../../../core/services/user-data.service';
import { TrackerService } from '../../../core/services/models/tracker.service';

@Component({
  selector: 'widgets-component',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './widgets.component.html',
  standalone: true,
})
export class WidgetsComponent {
  constructor(
    private vehiclesService: VehiclesService,
    private stopsService: StopsService,
    private userDataService: UserDataService,
    private trackerService: TrackerService
  ) {}

  private readonly destroy$ = new Subject<void>();
  public trackerData$ = this.trackerService.trackerData$;

  faStar = faStar;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  faSyncAlt = faSyncAlt;
  faLocationDot = faLocationDot;

  favoritesData$ = combineLatest([
    this.userDataService.favoritesNearby$,
    this.userDataService.favoritesNearbyIndex$,
  ]).pipe(
    map(([favoritesNearby, favoriteInViewIndex]) => ({
      favoritesNearby,
      favoriteInViewIndex,
    }))
  );

  decrementfavoritesNearbyIndex(): void {
    this.userDataService.decrementfavoritesNearbyIndex();
  }

  incrementfavoritesNearbyIndex(): void {
    this.userDataService.incrementfavoritesNearbyIndex();
  }

  setFavoritesNearbyIndex(
    favoriteInViewIndex: number | null,
    favoritesNearby: Stop[]
  ) {
    const favoritesNearbyIndex = this.userDataService.getfavoritesNearbyIndex();

    if (favoriteInViewIndex === null) {
      this.userDataService.setfavoritesNearbyIndex(0);
    } else {
      this.incrementfavoritesNearbyIndex();
    }
  }

  updateTrackedVehicle(vehicleNumber: string | null) {
    this.vehiclesService.updateTrackedVehicle(vehicleNumber);
  }

  getBusMarkerImage(): string {
    return 'bus.png';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onStopsWidgetClick(): void {
    this.userDataService.setSidebarMode('stop');
  }
}
