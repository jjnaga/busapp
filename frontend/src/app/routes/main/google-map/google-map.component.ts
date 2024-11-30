import {
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  runInInjectionContext,
  signal,
  Injector,
  effect,
} from '@angular/core';

import { toObservable } from '@angular/core/rxjs-interop';

import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { StopsService } from '../../../core/services/stops.service';
import {
  Marker,
  Stop,
  TrackerModel,
  Vehicle,
  Vehicles,
} from '../../../core/utils/global.types';
import {
  GoogleMap,
  GoogleMapsModule,
  MapAdvancedMarker,
} from '@angular/google-maps';
import { AsyncPipe, CommonModule } from '@angular/common';
import { UserDataService } from '../../../core/services/user-data.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faLocationCrosshairs,
  faPerson,
} from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { TrackerService } from '../../../core/services/models/tracker.service';

@Component({
  selector: 'google-map-component',
  templateUrl: './google-map.component.html',
  standalone: true,
  imports: [
    GoogleMap,
    GoogleMapsModule,
    MapAdvancedMarker,
    AsyncPipe,
    CommonModule,
    FontAwesomeModule,
  ],
})
export class GoogleMapComponent implements OnInit, OnDestroy {
  MIN_ZOOM_LEVEL_FOR_MARKERS = 16;
  PAN_DISABLE_DELAY = 3000;

  private _subscriptions: Subscription = new Subscription();
  private _destroy$ = new Subject<void>();
  private _ANIMATION_DURATION = 1000;
  private _FRAMES_PER_SECOND = 60;
  private isUserInteracting = new BehaviorSubject<boolean>(false);

  private autoPanTimeout: any; // Timeout handler for auto-pan reactivation

  boundsRectangle: google.maps.Rectangle | null = null;
  stopMarkers$ = new BehaviorSubject<Marker[]>([]);
  vehicleMarkers$ = new BehaviorSubject<Marker[]>([]);
  visibleStopMarkers$ = new BehaviorSubject<Marker[]>([]);
  trackerData$ = new BehaviorSubject<TrackerModel | null>(null);
  console = console;
  userPosition = signal<google.maps.LatLngLiteral | null>(null);
  map: google.maps.Map | null = null;
  watchPositionCallbackID: number = -1;
  faLocationCrosshairs = faLocationCrosshairs;
  faPerson = faPerson;
  // TODO: make map-advanced-marker, set it accordingly. basically migrate these two icons to html elements.
  markerIcon!: google.maps.Icon;
  favoriteMarkerIcon!: google.maps.Icon;

  mapOptions: google.maps.MapOptions = {
    mapId: '53da1ad002655c53',
    center: { lat: 21.3069, lng: -157.8583 },
    zoom: 12,
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: 'cooperative',
    scrollwheel: true,
    // zoomControlOptions: {
    //   position: google.maps.ControlPosition.RIGHT_BOTTOM,
    // },
  };

  constructor(
    private vehiclesService: VehiclesService,
    private stopsService: StopsService,
    private ngZone: NgZone,
    private userDataService: UserDataService,
    private trackerService: TrackerService,
    private toastr: ToastrService,
    private injector: Injector
  ) {}

  counter = signal(0);

  async ngOnInit() {
    await this.waitForGoogleMaps();
    this.setupMapEventListeners();
    this.subscribeToData();
    this.initializeMarkerIcons();

    this.startLocationTracking();

    // Run checkForNearbyFavoriteStops() inside DI context
    runInInjectionContext(this.injector, () => {
      effect(() => {
        this.checkForNearbyFavoriteStops();
      });
    });

    // setTimeout(() => {
    //   this.stopsService.setSelectedStop('2845');
    //   this.vehiclesService.updateTrackedVehicle('890', true);
    // }, 3000);
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Sets up listeners for map events (e.g., user interactions)
   */
  private setupMapEventListeners() {
    console.log('setupMapEventListeners');
    if (!this.map) return;
    console.log('setupMapEventListeners');

    // Listen for user starting interaction (dragging the map)
    this.map.addListener('dragstart', () => {
      this.disableAutoPan();
    });

    // Listen for user zoom changes
    this.map.addListener('zoom_changed', () => {
      this.disableAutoPan();
    });

    // Listen for when the user finishes interacting
    this.map.addListener('idle', () => {
      console.log('map idle. running event listneers');
      if (this.isUserInteracting.value) {
        this.scheduleAutoPanReactivation();
      }
    });
  }

  /**
   * Disables auto-pan when the user interacts with the map
   */
  private disableAutoPan() {
    this.isUserInteracting.next(true);

    // Clear any existing timeout to avoid immediate reactivation
    if (this.autoPanTimeout) {
      clearTimeout(this.autoPanTimeout);
      this.autoPanTimeout = null;
    }

    console.log('Auto-pan disabled.');
  }

  /**
   * Schedules auto-pan to reactivate after a delay (default 5 seconds)
   */
  private scheduleAutoPanReactivation() {
    if (this.autoPanTimeout) return; // Avoid stacking timeouts

    this.autoPanTimeout = setTimeout(() => {
      this.isUserInteracting.next(false);
      console.log('Auto-pan reactivated.');
    }, this.PAN_DISABLE_DELAY); // 3-second delay
  }

  async checkForNearbyFavoriteStops() {
    const userPosition = this.userPosition();

    const favorites: Stop[] = [];

    if (userPosition && userPosition.lat && userPosition.lng) {
      // Convert half a mile to meters
      const halfMileInMeters = 804.672; // 1609.34 / 2

      // Create a LatLng object from the user's position
      const center = new google.maps.LatLng(userPosition.lat, userPosition.lng);

      // Calculate new points in each direction
      const north = google.maps.geometry.spherical.computeOffset(
        center,
        halfMileInMeters,
        0
      );
      const south = google.maps.geometry.spherical.computeOffset(
        center,
        halfMileInMeters,
        180
      );
      const east = google.maps.geometry.spherical.computeOffset(
        center,
        halfMileInMeters,
        90
      );
      const west = google.maps.geometry.spherical.computeOffset(
        center,
        halfMileInMeters,
        270
      );

      // Create a LatLngBounds object
      const bounds = new google.maps.LatLngBounds();

      // Extend the bounds to include all points
      bounds.extend(north);
      bounds.extend(south);
      bounds.extend(east);
      bounds.extend(west);
      const rectangle = new google.maps.Rectangle({
        bounds: bounds,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
      });

      this.boundsRectangle = rectangle;

      this.userDataService.getFavorites().forEach((favorite) => {
        if (
          favorite.stopLat !== null &&
          favorite.stopLon !== null &&
          !isNaN(Number(favorite.stopLat)) &&
          !isNaN(Number(favorite.stopLon))
        ) {
          const favoriteLatLngLiteral: google.maps.LatLngLiteral = {
            lat: favorite.stopLat,
            lng: favorite.stopLon,
          };

          if (bounds.contains(favoriteLatLngLiteral)) {
            favorites.push(favorite);
          }
        }
      });

      if (favorites.length > 0) {
        this.userDataService.setfavoritesNearby(favorites);
      }
    }
  }

  private isMobileDevice(): boolean {
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone|Kindle|Silk|Mobile|Mobile Safari/i;
    return (
      mobileRegex.test(navigator.userAgent) || navigator.maxTouchPoints > 1
    );
  }

  private setMobileViewport() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    }
  }

  private applyMobileSettings() {
    this.setMobileViewport();
    this.mapOptions = {
      ...this.mapOptions,
      gestureHandling: 'greedy',
      zoomControl: false,
    };

    this.map?.setOptions(this.mapOptions);
  }

  private waitForGoogleMaps(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      if (typeof google?.maps?.Size === 'undefined') {
        const checkGoogleInterval = setInterval(() => {
          if (typeof google?.maps?.Size !== 'undefined') {
            clearInterval(checkGoogleInterval);
            this.ngZone.run(() => resolve());
          }
        }, 100);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        resolve();
      }
    });
  }

  private subscribeToData() {
    this._subscriptions.add(
      combineLatest([
        this.vehiclesService.trackedVehicle$,
        this.vehiclesService.vehicles$,
        this.isUserInteracting,
      ])
        .pipe(
          takeUntil(this._destroy$),
          // only operate if there are changes
          distinctUntilChanged(
            (prev, curr) =>
              prev[0] === curr[0] && prev[1] === curr[1] && prev[2] === curr[2]
          )
        )
        .subscribe({
          next: ([trackedVehicle, vehicles, isUserInteracting]) => {
            console.log(isUserInteracting);
            if (!isUserInteracting) {
              if (trackedVehicle) {
                vehicles = new Map<string, Vehicle>([
                  [trackedVehicle.busNumber, trackedVehicle],
                ]);
              }
            }

            const vehicleMarkers = this.createVehicleMarkers(vehicles);
            this.vehicleMarkers$.next(vehicleMarkers);
          },
          error: (err) =>
            console.error('Error in tracking subscription: ', err),
        })
    );

    this._subscriptions.add(
      this.stopsService.stops$
        .pipe(
          takeUntil(this._destroy$),
          map((stops) => this.createStopMarkers(stops))
        )
        .subscribe((stopMarkers) => this.stopMarkers$.next(stopMarkers))
    );

    // As soon as a bus stop is favorited, change the color.
    this._subscriptions.add(
      this.userDataService.favorites$.subscribe(() => {
        this.updateVisibleMarkers();
      })
    );

    // This handles the movement of the map based on if the bus is selected, blah blah
    this._subscriptions.add(
      this.trackerService.trackerData$.subscribe((data) => {
        this.trackerData$.next(data);

        // User is manually moving, dont move the map.
        if (this.isUserInteracting.value) {
          console.log('user is interacting, dont move.');
          return;
        }
        const { arrival, stop, vehicle, mode } = data;
        // Bus Mode
        if (mode && mode.bus && vehicle) {
          this.panToVehicle(vehicle);
          return;
        }

        if (
          mode &&
          mode.both &&
          vehicle &&
          stop &&
          stop.stopLat &&
          stop.stopLon
        ) {
          const bounds = new google.maps.LatLngBounds();

          const stopCoordinates = new google.maps.LatLng(
            stop.stopLat,
            stop.stopLon
          );

          const vehicleCoordinates = new google.maps.LatLng(
            vehicle.latitude,
            vehicle.longitude
          );

          bounds.extend(stopCoordinates);
          bounds.extend(vehicleCoordinates);

          if (this.map) {
            this.map.fitBounds(bounds, 15);
          }
        }
      })
    );
  }

  // private panToBothMode(data: TrackerModel) {}

  panTo(latLng: google.maps.LatLngLiteral, zoomLevel?: number) {
    if (this.map) {
      this.map.panTo(latLng);
      this.map.setZoom(zoomLevel ?? this.MIN_ZOOM_LEVEL_FOR_MARKERS);
    }
  }

  panToVehicle(vehicle: Vehicle) {
    const coordinates: google.maps.LatLngLiteral = {
      lat: vehicle.latitude,
      lng: vehicle.longitude,
    };

    this.panTo(coordinates);
  }

  private createStopMarkers(stops?: Stop[]): Marker[] {
    if (!stops) return [];
    return stops
      .filter(
        (stop): stop is Stop & { stopLat: number; stopLon: number } =>
          stop.stopLat !== null &&
          stop.stopLon !== null &&
          !isNaN(stop.stopLat) &&
          !isNaN(stop.stopLon)
      )
      .map((stop) => ({
        id: `stop-${stop.stopCode}`,
        stopCode: stop.stopCode,
        position: { lat: stop.stopLat, lng: stop.stopLon },
        title: stop.stopName || 'Unnamed Stop',
        type: 'stop',
      }));
  }

  private createVehicleMarkers(vehicles?: Map<string, Vehicle>): Marker[] {
    if (!vehicles) return [];
    return Array.from(vehicles.values()).map((vehicle) => ({
      id: `${vehicle.busNumber}`,
      position: { lat: vehicle.latitude, lng: vehicle.longitude },
      title: `Bus ${vehicle.busNumber}`,
      type: 'bus',
      content: this.createBusMarkerContent(),
    }));
  }

  createBusMarkerContent(): HTMLImageElement {
    const imgTag = document.createElement('img');
    imgTag.src = 'bus.png';
    imgTag.width = 20;
    imgTag.height = 20;
    return imgTag;
  }

  createUserIconContent(): HTMLImageElement {
    const imgTag = document.createElement('img');
    imgTag.src = 'person.jpg';
    imgTag.width = 20;
    imgTag.height = 20;
    return imgTag;
  }

  trackByMarkerId(index: number, marker: Marker): string {
    return marker.id;
  }

  onMapReady(map: google.maps.Map) {
    this.map = map;

    this.map.setOptions(this.mapOptions);

    if (this.isMobileDevice()) {
      this.applyMobileSettings();
    }

    this.map.addListener('zoom_changed', () => {
      this.updateVisibleMarkers();
    });

    this.map.addListener('bounds_changed', () => {
      this.updateVisibleMarkers();
    });

    this.updateVisibleMarkers();

    const centerControlDiv = document.createElement('div');
    const centerControl = this.createCenterControl();
    centerControlDiv.appendChild(centerControl);

    this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(
      centerControlDiv
    );
  }

  createCenterControl() {
    const controlButton = document.createElement('button');

    controlButton.style.backgroundColor = '#fff';
    controlButton.style.border = '2px solid #fff';
    controlButton.style.borderRadius = '3px';
    controlButton.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlButton.style.color = 'rgb(25,25,25)';
    controlButton.style.cursor = 'pointer';
    controlButton.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlButton.style.fontSize = '16px';
    controlButton.style.lineHeight = '38px';
    controlButton.style.margin = '0 15px 100px 0';
    // controlButton.style.marginBottom = '100px';
    controlButton.style.padding = '0 5px';
    controlButton.style.textAlign = 'center';

    controlButton.textContent = 'Center';
    controlButton.title = 'Click to recenter the map';
    controlButton.type = 'button';

    controlButton.addEventListener('click', () => {
      this.startLocationTracking();
    });

    return controlButton;
  }

  private initializeMarkerIcons() {
    this.markerIcon = {
      url:
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="1"
      >
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 4.97 7 13 7 13s7-8.03 7-13c0-3.87-3.13-7-7-7z"
          fill="#DB3A34"
          stroke="#000"
          stroke-width="1"
        />
        <circle cx="12" cy="9" r="2.5" fill="#000" />
      </svg>
    `),
      // scaledSize: new google.maps.Size(48, 48), // Adjust the size as needed
      // anchor: new google.maps.Point(24, 48), // Anchor at the bottom center
      scaledSize: new google.maps.Size(33.6, 33.6), // 70% of 48x48
      anchor: new google.maps.Point(16.8, 33.6), // 70% of previous anchor
    };

    this.favoriteMarkerIcon = {
      url:
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
      >
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 4.97 7 13 7 13s7-8.03 7-13c0-3.87-3.13-7-7-7z"
          fill="#FFD700"
          stroke="#000"
          stroke-width="1"
        />
        <circle cx="12" cy="9" r="2.5" fill="#000" />
      </svg>
    `),
      scaledSize: new google.maps.Size(48, 48), // Adjust the size as needed
      anchor: new google.maps.Point(24, 48), // Anchor at the bottom center
    };
  }

  private updateVisibleMarkers() {
    if (!this.map) return;

    const currentZoom = this.map.getZoom();
    const bounds = this.map.getBounds();

    if (
      currentZoom !== undefined &&
      bounds &&
      currentZoom >= this.MIN_ZOOM_LEVEL_FOR_MARKERS
    ) {
      const visibleStopMarkersMap = new Map<string, Marker>();

      this.stopMarkers$.value.forEach((marker) => {
        if (bounds.contains(marker.position)) {
          marker.stopCode && visibleStopMarkersMap.set(marker.stopCode, marker);
        }
      });

      const favorites = this.userDataService.getFavorites();

      // Check if a favorite bus stop is in the visible markers, and if so, mark it.
      for (let favorite of favorites) {
        const marker = visibleStopMarkersMap.get(favorite.stopId);
        if (marker) {
          marker.favorite = true;
        }
      }

      this.visibleStopMarkers$.next(Array.from(visibleStopMarkersMap.values()));
    } else {
      this.visibleStopMarkers$.next([]);
    }
  }

  private updateUserPosition(position: GeolocationPosition) {
    this.ngZone.run(() => {
      this.userPosition.set({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    });
  }

  startLocationTracking() {
    // TODO: Verbiage can be softer
    this.toastr.info('Finding your location');

    if (!navigator.geolocation) {
      this.toastr.error('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          this.updateUserPosition(position);
          this.panTo(newCenter, 17);
        });
      },
      (error) => console.error('Error getting geolocation: ', error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  onMarkerClick(marker: any): void {
    switch (marker.type) {
      case 'bus':
        const { id: vehicleNumber } = marker;
        if (vehicleNumber) {
          this.vehiclesService.updateTrackedVehicle(vehicleNumber);
        }
        break;
      case 'stop':
        const { stopCode } = marker;
        this.stopsService.setSelectedStop(stopCode);
        break;
      default:
        this.toastr.info('Marker not supported');
    }
  }
}
