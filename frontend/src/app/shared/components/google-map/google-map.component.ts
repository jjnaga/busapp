import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { StopsService } from '../../../core/services/stops.service';
import {
  Marker,
  Stop,
  Vehicle,
  Vehicles,
} from '../../../core/models/global.model';
import { GoogleMap, MapAdvancedMarker } from '@angular/google-maps';
import { AsyncPipe, CommonModule } from '@angular/common';
import { UserDataService } from '../../../core/services/user-data.service';

@Component({
  selector: 'google-map-component',
  templateUrl: './google-map.component.html',
  standalone: true,
  imports: [GoogleMap, MapAdvancedMarker, AsyncPipe, CommonModule],
})
export class GoogleMapComponent implements OnInit, OnDestroy {
  MIN_ZOOM_LEVEL_FOR_MARKERS = 16; // Adjust this value as needed

  private subscriptions: Subscription = new Subscription();
  private destroy$ = new Subject<void>();
  map: google.maps.Map | null = null;
  stopMarkers$ = new BehaviorSubject<Marker[]>([]);
  vehicleMarkers$ = new BehaviorSubject<Marker[]>([]);
  visibleStopMarkers$ = new BehaviorSubject<Marker[]>([]);
  console = console;

  mapOptions: google.maps.MapOptions = {
    mapId: '53da1ad002655c53',
    center: { lat: 21.3069, lng: -157.8583 },
    zoom: 12,
    disableDefaultUI: true,
    // mobile friendly options
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: 'greedy',
    scrollwheel: false,
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

    // mobile friendly options
    this.addTouchEventListeners();
  }

  ngOnDestory() {
    this.removeTouchEventListeners();
  }
  private removeTouchEventListeners() {
    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.removeEventListener('touchstart', this.preventZoom);
      mapElement.removeEventListener('touchmove', this.preventZoom);
    }
  }

  private addTouchEventListeners = () => {
    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.addEventListener('touchstart', this.preventZoom, {
        passive: false,
      });
    }
  };

  private preventZoom = (e: TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  private waitForGoogleMaps(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      // TODO: I know there is a event driven way to do this.
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
      this.vehiclesService.vehicles$
        .pipe(
          takeUntil(this.destroy$),
          map((vehicles) => this.createVehicleMarkers(vehicles))
        )
        .subscribe((vehicleMarkers) =>
          this.vehicleMarkers$.next(vehicleMarkers)
        )
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
      id: `bus-${vehicle.busNumber}`,
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

  trackByMarkerId(index: number, marker: Marker): string {
    return marker.id;
  }

  onMapReady(map: google.maps.Map) {
    this.map = map;
    this.map.setCenter({ lat: 21.2968, lng: -157.8531 });
    this.map.setZoom(14);

    // Set zoom control options here
    this.map.setOptions({
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
    });

    this.map.addListener('zoom_changed', () => {
      this.updateVisibleMarkers();
    });

    this.map.addListener('bounds_changed', () => {
      this.updateVisibleMarkers();
    });

    this.updateVisibleMarkers();
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
      const visibleVehicleMarkers = this.vehicleMarkers$.value.filter(
        (marker) => bounds.contains(marker.position)
      );

      this.visibleStopMarkers$.next(visibleStopMarkers);
    } else {
      this.visibleStopMarkers$.next([]);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onMarkerClick(marker: any): void {
    switch (marker.type) {
      case 'bus':
        console.log('bus');
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
