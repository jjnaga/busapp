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
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { StopsService } from '../../../core/services/stops.service';
import { Marker, Stop, Vehicle } from '../../../core/utils/global.types';
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

  private _subscriptions: Subscription = new Subscription();
  private _destroy$ = new Subject<void>();
  private _ANIMATION_DURATION = 1000;
  private _FRAMES_PER_SECOND = 60;

  boundsRectangle: google.maps.Rectangle | null = null;
  stopMarkers$ = new BehaviorSubject<Marker[]>([]);
  vehicleMarkers$ = new BehaviorSubject<Marker[]>([]);
  visibleStopMarkers$ = new BehaviorSubject<Marker[]>([]);
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
    private toastr: ToastrService,
    private injector: Injector
  ) {}

  counter = signal(0);

  async ngOnInit() {
    await this.waitForGoogleMaps();
    this.subscribeToData();
    this.initializeMarkerIcons();

    this.startLocationTracking();

    // Run checkForNearbyFavoriteStops() inside DI context
    runInInjectionContext(this.injector, () => {
      effect(() => {
        this.checkForNearbyFavoriteStops();
      });
    });

    this.vehiclesService.updateTrackedVehicle('35');
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
    this._destroy$.next();
    this._destroy$.complete();
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
      ])
        .pipe(
          takeUntil(this._destroy$),
          // only operate if there are changes
          distinctUntilChanged(
            (prev, curr) => prev[0] === curr[0] && prev[1] === curr[1]
          )
        )
        .subscribe({
          next: ([trackedVehicle, vehicles]) => {
            const vehicleMarkers = this.createVehicleMarkers(vehicles);
            this.vehicleMarkers$.next(vehicleMarkers);

            if (trackedVehicle) {
              this.panToVehicle(trackedVehicle);
            }
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

    this.stopsService.selectedStop$
      .pipe(
        takeUntil(this._destroy$),
        filter(
          (
            selectedStop
          ): selectedStop is Stop & { stopLat: number; stopLon: number } =>
            selectedStop !== undefined &&
            selectedStop.stopLat !== undefined &&
            selectedStop.stopLon !== undefined
        ),
        map((selectedStop) => ({
          lat: selectedStop.stopLat,
          lng: selectedStop.stopLon,
        }))
      )
      .subscribe((latLng) => {
        this.panTo(latLng);
      });

    // As soon as a bus stop is favorited, change the color.
    this._subscriptions.add(
      this.userDataService.favorites$.subscribe(() => {
        this.updateVisibleMarkers();
      })
    );
  }

  // TODO: Set a timer, wait like 5 seconds to see if Google maps loads.
  // panTo(latLng: google.maps.LatLngLiteral) {
  //   if (!this.map) {
  //     this.toastr.error('Cannot pan: map is not defined');
  //     return;
  //   }

  //   const startLatLng = this.map.getCenter()?.toJSON() ?? null;

  //   if (startLatLng === null) {
  //     this.toastr.error('Cannot pan: center is not defined');
  //     return;
  //   }

  //   const startZoom = this.map.getZoom() || 0;
  //   const targetZoom = this.MIN_ZOOM_LEVEL_FOR_MARKERS;

  //   const latDiff = startLatLng.lat - startLatLng.lat;
  //   const lngDiff = startLatLng.lng - startLatLng.lng;
  //   const zoomDiff = targetZoom - startZoom;

  //   const steps = Math.floor(
  //     this._ANIMATION_DURATION / (1000 / this._FRAMES_PER_SECOND)
  //   );
  //   let step = 0;

  //   const animate = () => {
  //     if (step >= steps) return;

  //     const progress = step / steps;
  //     const easedProgress = this.easeInOutCubic(progress);

  //     const newLat = startLatLng.lat + latDiff * easedProgress;
  //     const newLng = startLatLng.lng + lngDiff * easedProgress;
  //     const newZoom = startZoom + zoomDiff * easedProgress;

  //     this.map?.panTo({ lat: newLat, lng: newLng });
  //     this.map?.setZoom(newZoom);

  //     step++;
  //     requestAnimationFrame(animate);
  //   };

  //   animate();
  // }

  // private easeInOutCubic(t: number): number {
  //   return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  // }

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
