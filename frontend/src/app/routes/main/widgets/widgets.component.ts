import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { StopsService } from '../../../core/services/stops.service';
import {
  combineLatest,
  filter,
  interval,
  map,
  Observable,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import {
  Stop,
  TrackerComponentData,
  TrackerComponentMode,
} from '../../../core/utils/global.types';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChevronLeft,
  faLocationDot,
  faChevronRight,
  faStar,
  faSyncAlt,
} from '@fortawesome/free-solid-svg-icons';
import { UserDataService } from '../../../core/services/user-data.service';

@Component({
  selector: 'widgets-component',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './widgets.component.html',
  standalone: true,
})
export class WidgetsComponent implements OnInit, OnDestroy {
  constructor(
    private vehiclesService: VehiclesService,
    private stopsService: StopsService,
    private userDataService: UserDataService
  ) {}

  ngOnInit(): void {
    this.trackerData$.subscribe();
  }

  private readonly destroy$ = new Subject<void>();
  private trackedVehicle$ = this.vehiclesService.trackedVehicle$;
  private selectedStop$ = this.stopsService.selectedStop$;
  private selectedStopData$ = this.stopsService.selectedStopData$;
  private selectedBusAtStop$ = this.stopsService.selectedBusAtStop$;

  trackerMode: TrackerComponentMode = {
    both: false,
    bus: false,
    stop: false,
  };

  faStar = faStar;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  faSyncAlt = faSyncAlt;
  faLocationDot = faLocationDot;

  // Used in trackerData$
  private trackedVehicleSecondsSinceUpdate$ = this.trackedVehicle$.pipe(
    filter((trackedVehicle) => !!trackedVehicle?.heartbeat),
    switchMap((trackedVehicle) =>
      interval(1000).pipe(
        map(() => {
          // trust me 🤭
          const date = new Date(trackedVehicle!.heartbeat).getTime();
          const now = new Date().getTime();
          return Math.floor((now - date) / 1000);
        })
      )
    )
  );

  trackerData$: Observable<TrackerComponentData> = combineLatest([
    this.trackedVehicle$,
    this.trackedVehicleSecondsSinceUpdate$.pipe(startWith(undefined)),
    this.selectedStop$,
    this.selectedStopData$,
    this.selectedBusAtStop$,
  ]).pipe(
    map(
      ([
        trackedVehicle,
        trackedVehicleSecondsSinceUpdate,
        selectedStop,
        selectedStopData,
        selectedBusAtStop,
      ]) => {
        const vehicle =
          trackedVehicle !== null &&
          trackedVehicleSecondsSinceUpdate !== undefined
            ? {
                ...trackedVehicle!,
                lastUpdated: trackedVehicleSecondsSinceUpdate,
              }
            : undefined;

        const stop = selectedStop ?? undefined;
        const arrival = selectedStopData?.arrivals.find(
          (arrival) => arrival.vehicle === selectedBusAtStop?.busNumber
        );

        return {
          vehicle,
          stop,
          arrival,
        };
      }
    ),
    tap((data) => {
      this.setTrackerMode(data);
      console.log('widgets data', data);
    }),
    takeUntil(this.destroy$) // Automatically unsubscribes on destroy
  );

  favoritesData$ = combineLatest([
    this.userDataService.favoritesNearby$,
    this.userDataService.favoritesNearbyIndex$,
  ]).pipe(
    map(([favoritesNearby, favoriteInViewIndex]) => ({
      favoritesNearby,
      favoriteInViewIndex,
    }))
  );

  private setTrackerMode(data: TrackerComponentData) {
    // If arrival, set combined mode.
    if (!!data.arrival) {
      this.trackerMode.both = true;
      this.trackerMode.bus = false;
      this.trackerMode.stop = false;
      return;
    }

    // Set stop and/or bus
    if (!!data.stop) {
      this.trackerMode.stop = true;
    }

    if (!!data.vehicle) {
      this.trackerMode.bus = true;
      return;
    }

    // Default set to false.
    this.trackerMode = {
      both: false,
      bus: false,
      stop: false,
    };
  }

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
