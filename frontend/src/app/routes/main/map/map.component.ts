import { Component, inject, OnInit } from '@angular/core';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { Subscription, Subject, BehaviorSubject, combineLatest, Observable, fromEvent, EMPTY, of } from 'rxjs';
import { debounceTime, filter, startWith, take, switchMap, tap } from 'rxjs/operators';
import { Stop, Vehicle } from '../../../core/utils/global.types';
import { MarkerService } from '../../../core/services/marker.service';
import { Store } from '@ngrx/store';
import { selectVehicleEntities } from '../../../core/state/lib/vehicles/vehicles.selectors';
import { selectUserLocation } from '../../../core/state/lib/user-location/user-location.selectors';
import { MapLayoutService } from '../../../core/services/map-layout.service';
import { selectSelectedStop } from '../../../core/state/lib/user/user.selectors';
import { GoogleMapsLoaderService } from '../../../core/services/google-maps-loader.service';
import { Dictionary } from '@ngrx/entity';
import { selectIsMobile } from '../../../core/state/lib/layout/layout.selectors';
import { selectAllStopsSortedByDistance } from '../../../core/state/lib/stops/stops.selectors';
import { MapViewportService } from '../../../core/services/map-viewport.service';

@Component({
  selector: 'map-component',
  templateUrl: './map.component.html',
  standalone: true,
  imports: [GoogleMap, GoogleMapsModule, CommonModule],
})
export class MapComponent implements OnInit {
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

  private hasPanAndZoomed = false;
  private mapEvents$ = new Subject<void>();

  mapReady$ = new BehaviorSubject<google.maps.Map | null>(null);
  stopsAndMapEventsSubscription!: Subscription;
  vehiclesSubscription!: Subscription;
  userLocationSubscription!: Subscription;

  private markerService = inject(MarkerService);
  private mapViewportService = inject(MapViewportService);
  private store = inject(Store);
  private mapLayoutService = inject(MapLayoutService);
  private googleMapsLoader = inject(GoogleMapsLoaderService);

  mapsLoaded$ = this.googleMapsLoader.mapsLoaded$;
  isMobile$ = this.store.select(selectIsMobile);
  stopsSortedByDistance$: Observable<Stop[]> = this.store.select(selectAllStopsSortedByDistance);
  vehicles$: Observable<Dictionary<Vehicle>> = this.store.select(selectVehicleEntities);

  ngOnInit(): void {
    // pan to center after resize
    fromEvent(window, 'resize')
      .pipe(debounceTime(100))
      .subscribe(() => {
        if (this.map) this.map.panTo(this.map.getCenter()!);
      });

    combineLatest([
      this.mapsLoaded$.pipe(
        filter((loaded) => loaded),
        take(1)
      ),
      this.mapReady$.pipe(
        filter((map) => map !== null),
        take(1)
      ),
    ]).subscribe(() => {
      // On mobile, edit viewport height on google-map based on drawer height.
      combineLatest([this.store.select(selectIsMobile), this.mapLayoutService.visibleDrawerHeight$]).subscribe(
        ([isMobile, drawerHeight]) => {
          if (this.map) {
            const viewportHeight = window.innerHeight;
            this.map.getDiv().style.height = isMobile ? `${viewportHeight - drawerHeight}px` : `${viewportHeight}px`;
          }
        }
      );

      // Stops subscription: updates on stops or map events.
      this.stopsAndMapEventsSubscription = combineLatest([
        this.stopsSortedByDistance$,
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
        this.markerService.updateVehicleMarkers(vehicles, this.minZoomLevel);
      });

      // Subscribe to selected stop changes

      // Handle user location
      this.userLocationSubscription = combineLatest([
        this.store
          .select(selectUserLocation)
          .pipe(filter((loc) => loc && loc.latitude !== null && loc.longitude !== null)),
        this.mapReady$.pipe(filter((map) => map !== null)),
      ]).subscribe(([loc]) => {
        const newCenter = { lat: loc.latitude!, lng: loc.longitude! };

        if (this.map && !this.hasPanAndZoomed) {
          this.panAndZoom(newCenter, 17);
        } else {
          this.mapOptions.center = newCenter;
        }

        this.markerService.updateUserMarker(loc.latitude!, loc.longitude!);
      });
    });

    this.store
      .select(selectSelectedStop)
      .pipe(
        // Only continue if the stop has valid coordinates.
        filter((stop) => !!stop && stop.stopLat !== null && stop.stopLon !== null),
        switchMap((selectedStop) => {
          if (!selectedStop) return EMPTY;

          const stopCoords: google.maps.LatLngLiteral = { lat: selectedStop.stopLat!, lng: selectedStop.stopLon! };
          const busCoords$ = this.mapViewportService.getFirstBusCoordinates(selectedStop);
          if (busCoords$) {
            // Combine stop and bus coordinates; debounce to smooth out rapid bus updates.
            return combineLatest([of(stopCoords), busCoords$]).pipe(debounceTime(500));
          } else {
            // Cancel the operation if bus coordinates are not available.
            return EMPTY;
          }
        })
      )
      .subscribe(([stopCoords, busCoords]) => {
        if (this.map) {
          // Compute bounds to include both points.
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(new google.maps.LatLng(stopCoords.lat, stopCoords.lng));
          bounds.extend(new google.maps.LatLng(busCoords.lat, busCoords.lng));
          this.map.fitBounds(this.mapViewportService.computeBounds(stopCoords, busCoords), {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          });
        }
      });
  }

  onMapReady(event: google.maps.Map | Event) {
    const map = event as google.maps.Map;
    this.map = map;
    this.map.setOptions(this.mapOptions);
    this.markerService.init(map);
    this.mapReady$.next(map);

    map.addListener('idle', () => this.mapEvents$.next());
    map.addListener('zoom_changed', () => this.mapEvents$.next());
  }

  panAndZoom(newCenter: google.maps.LatLngLiteral, newZoom: number = 15): void {
    if (this.map) {
      this.map.panTo(newCenter);
      this.map.setZoom(newZoom);
      this.hasPanAndZoomed = true;
    }
  }
}
