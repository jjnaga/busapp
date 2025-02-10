// src/app/routes/main/map/map.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Subscription, Subject, BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, startWith, tap } from 'rxjs/operators';
import { Stop, Vehicle, VehicleMap } from '../../../core/utils/global.types';
import { MarkerService } from '../../../core/services/marker.service';
import { Store } from '@ngrx/store';
import { selectAllStops } from '../../../core/state/lib/stops/stops.selectors';
import { selectAllVehicles } from '../../../core/state/lib/vehicles/vehicles.selectors';
import { selectUserLocation } from '../../../core/state/lib/user-location/user-location.selectors';
import { MapLayoutService } from '../../../core/services/map-layout.service';

@Component({
  selector: 'map-component',
  templateUrl: './map.component.html',
  standalone: true,
  imports: [GoogleMap, GoogleMapsModule, CommonModule],
})
export class MapComponent implements OnInit, OnDestroy {
  minZoomLevel: number = 15;
  map: google.maps.Map | null = null;
  mapOptions: google.maps.MapOptions = {
    mapId: '53da1ad002655c53',
    center: { lat: 21.3069, lng: -157.8583 },
    zoom: 12,
    gestureHandling: 'greedy',
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
  };

  stops$: Observable<Stop[]> = this.store.select(selectAllStops);
  vehicles$: Observable<VehicleMap> = this.store.select(selectAllVehicles);

  private hasPanAndZoomed = false;
  private mapEvents$ = new Subject<void>();
  private mapReady$ = new BehaviorSubject<google.maps.Map | null>(null);
  stopsAndMapEventsSubscription!: Subscription;
  vehiclesSubscription!: Subscription;
  userLocationSubscription!: Subscription;

  constructor(
    private markerService: MarkerService,
    private toastrService: ToastrService,
    private store: Store,
    private mapLayoutService: MapLayoutService
  ) {}

  ngOnInit() {
    // Stops subscription: updates on stops or map events.
    this.stopsAndMapEventsSubscription = combineLatest([
      this.stops$,
      this.mapEvents$.pipe(startWith(void 0)),
    ]).subscribe(([stops]) => {
      if (this.map) {
        this.markerService.updateStopMarkers(stops, this.minZoomLevel);
      }
    });

    // Vehicles subscription: only update when the map is ready.
    this.vehiclesSubscription = combineLatest([
      this.vehicles$,
      this.mapReady$.pipe(filter((map) => map !== null)),
    ]).subscribe(([vehicles]) => {
      // Map is guaranteed to be available here.
      this.markerService.updateVehicleMarkers(vehicles, this.minZoomLevel);
    });

    this.userLocationSubscription = combineLatest([
      this.store
        .select(selectUserLocation)
        .pipe(filter((loc) => loc && loc.latitude !== null && loc.longitude !== null)),
      this.mapReady$.pipe(filter((map) => map !== null)),
    ]).subscribe(([loc]) => {
      const newCenter = { lat: loc.latitude!, lng: loc.longitude! };

      if (this.map) {
        this.panAndZoom(newCenter, 17);
      } else {
        // If the map isn't ready yet, update mapOptions so it centers correctly upon initialization.
        this.mapOptions.center = newCenter;
      }

      // Update or create the user marker on the map.
      this.markerService.updateUserMarker(loc.latitude!, loc.longitude!);
    });

    this.mapLayoutService.visibleDrawerHeight$.subscribe((height) => {
      this.adjustMapHeight(height);
    });
  }
  private adjustMapHeight(drawerVisibleHeight: number) {
    if (this.map) {
      const viewportHeight = window.innerHeight;
      const mapHeight = viewportHeight - drawerVisibleHeight;
      const mapElement = this.map.getDiv();
      mapElement.style.height = `${mapHeight}px`;
    }
  }

  onMapReady(map: google.maps.Map) {
    this.map = map;
    this.map.setOptions(this.mapOptions);
    this.markerService.init(map);

    // Emit the map once it's ready.
    this.mapReady$.next(map);

    // When the map is idle or zoom changes, emit an event.
    map.addListener('idle', () => this.mapEvents$.next());
    map.addListener('zoom_changed', () => this.mapEvents$.next());
  }

  panAndZoom(newCenter: google.maps.LatLngLiteral, newZoom: number = 15): void {
    if (!this.hasPanAndZoomed && this.map) {
      // Use panTo for a smooth transition; setZoom instantly changes the zoom level.
      this.map.panTo(newCenter);
      this.map.setZoom(newZoom);
      this.hasPanAndZoomed = true;
    }
  }

  ngOnDestroy() {
    if (this.stopsAndMapEventsSubscription) {
      this.stopsAndMapEventsSubscription.unsubscribe();
    }

    if (this.vehiclesSubscription) {
      this.vehiclesSubscription.unsubscribe();
    }

    this.markerService.clearAllMarkers();
  }
}
