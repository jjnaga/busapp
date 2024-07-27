import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { StopsService } from '../../../core/services/stops.service';
import { Marker, Stop, Vehicle } from '../../../core/utils/global.types';
import { GoogleMap, MapAdvancedMarker } from '@angular/google-maps';
import { AsyncPipe, CommonModule } from '@angular/common';
import { UserDataService } from '../../../core/services/user-data.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLocationCrosshairs } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'google-map-component',
  templateUrl: './google-map.component.html',
  standalone: true,
  imports: [
    GoogleMap,
    MapAdvancedMarker,
    AsyncPipe,
    CommonModule,
    FontAwesomeModule,
  ],
})
export class GoogleMapComponent implements OnInit, OnDestroy {
  MIN_ZOOM_LEVEL_FOR_MARKERS = 16;

  private subscriptions: Subscription = new Subscription();
  private destroy$ = new Subject<void>();

  stopMarkers$ = new BehaviorSubject<Marker[]>([]);
  vehicleMarkers$ = new BehaviorSubject<Marker[]>([]);
  visibleStopMarkers$ = new BehaviorSubject<Marker[]>([]);
  console = console;
  userPosition: google.maps.LatLngLiteral | null = null;
  map: google.maps.Map | null = null;
  watchPositionCallbackID: number = -1;
  faLocationCrosshairs = faLocationCrosshairs;

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
  };

  constructor(
    private vehiclesService: VehiclesService,
    private stopsService: StopsService,
    private ngZone: NgZone,
    private userDataService: UserDataService
  ) {}

  async ngOnInit() {
    await this.waitForGoogleMaps();
    this.subscribeToData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.subscriptions.add(
      combineLatest([
        this.vehiclesService.trackedVehicle$,
        this.vehiclesService.vehicles$,
      ])
        .pipe(
          takeUntil(this.destroy$),
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
              console.log('ok updating', trackedVehicle);
              this.panToVehicle(trackedVehicle);
            } else {
              console.log('no trackedVehicle');
            }
          },
          error: (err) =>
            console.error('Error in tracking subscription: ', err),
        })
    );

    this.subscriptions.add(
      this.stopsService.stops$
        .pipe(
          takeUntil(this.destroy$),
          map((stops) => this.createStopMarkers(stops))
        )
        .subscribe((stopMarkers) => this.stopMarkers$.next(stopMarkers))
    );
  }

  panToVehicle(vehicle: Vehicle) {
    const coordinates: google.maps.LatLngLiteral = {
      lat: vehicle.latitude,
      lng: vehicle.longitude,
    };

    this.map?.setZoom(this.MIN_ZOOM_LEVEL_FOR_MARKERS);
    this.map?.panTo(coordinates);
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

  private createBusMarkerContent(): HTMLImageElement {
    const imgTag = document.createElement('img');
    imgTag.src = 'assets/bus.png';
    imgTag.width = 50;
    imgTag.height = 50;
    return imgTag;
  }

  private trackBusOnMap(): void {}

  private createUserIconContent(): HTMLImageElement {
    const imgTag = document.createElement('img');
    imgTag.src = 'assets/bus.png';
    imgTag.width = 50;
    imgTag.height = 50;
    return imgTag;
  }

  trackByMarkerId(index: number, marker: Marker): string {
    return marker.id;
  }

  onMapReady(map: google.maps.Map) {
    this.map = map;
    this.map.setCenter({ lat: 21.2968, lng: -157.8531 });
    this.map.setZoom(14);

    this.map.setOptions({
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
    });

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

  private updateVisibleMarkers() {
    if (!this.map) return;

    const currentZoom = this.map.getZoom();
    const bounds = this.map.getBounds();

    if (
      currentZoom !== undefined &&
      bounds &&
      currentZoom >= this.MIN_ZOOM_LEVEL_FOR_MARKERS
    ) {
      const visibleStopMarkers = this.stopMarkers$.value.filter((marker) =>
        bounds.contains(marker.position)
      );
      // const visibleVehicleMarkers = this.vehicleMarkers$.value.filter(
      //   (marker) => bounds.contains(marker.position)
      // );

      this.visibleStopMarkers$.next(visibleStopMarkers);
    } else {
      this.visibleStopMarkers$.next([]);
    }
  }

  private updateUserPosition(position: GeolocationPosition) {
    console.log('Updating user position');
    this.ngZone.run(() => {
      this.userPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    });
  }

  startLocationTracking() {
    console.log('Starting location tracking');
    if (navigator.geolocation && this.map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.ngZone.run(() => {
            const newCenter = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            this.updateUserPosition(position);

            // Instantly set the new center and zoom
            this.map!.setCenter(newCenter);
            this.map!.setZoom(this.MIN_ZOOM_LEVEL_FOR_MARKERS);

            console.log('New center:', newCenter);
            console.log('New zoom:', this.MIN_ZOOM_LEVEL_FOR_MARKERS);
          });
        },
        (error) => console.error('Error getting geolocation: ', error),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.error(
        'Geolocation is not supported by this browser or map is not initialized.'
      );
    }
  }

  onMarkerClick(marker: any): void {
    switch (marker.type) {
      case 'bus':
        console.log('bus', marker);
        const { id: vehicleNumber } = marker;
        if (vehicleNumber) {
          this.vehiclesService.updateTrackedVehicle(vehicleNumber);
        }
        break;
      case 'stop':
        const { stopCode } = marker;
        console.log('stop', stopCode, typeof stopCode);
        this.userDataService.setSelectedStop(stopCode);
        break;
      default:
        console.log('NA');
    }
  }
}
