import { Component, inject, OnInit } from '@angular/core';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { Subscription, BehaviorSubject, combineLatest, Observable, fromEvent, firstValueFrom } from 'rxjs';
import { debounceTime, filter, take } from 'rxjs/operators';
import { Stop, Vehicle, MAP_CONTROLLER } from '../../../core/utils/global.types';
import { MarkerService } from '../../../core/services/markers/marker.service';
import { Store } from '@ngrx/store';
import { selectVehicleEntities } from '../../../core/state/lib/vehicles/vehicles.selectors';
import { selectUserLocation } from '../../../core/state/lib/user-location/user-location.selectors';
import { MapLayoutService } from '../../../core/services/maps/map-layout.service';
import { GoogleMapsLoaderService } from '../../../core/services/maps/google-maps-loader.service';
import { Dictionary } from '@ngrx/entity';
import { selectIsMobile } from '../../../core/state/lib/layout/layout.selectors';
import { selectAllStopsSortedByDistance } from '../../../core/state/lib/stops/stops.selectors';
import { CameraMode, DirectorService } from '../../../core/services/director.service';
import { MapControllerService } from '../../../core/services/maps/map-controller.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'map-component',
  templateUrl: './map.component.html',
  standalone: true,
  imports: [GoogleMap, GoogleMapsModule, CommonModule],
  providers: [
    {
      provide: MAP_CONTROLLER,
      useExisting: MapComponent,
    },
  ],
})
export class MapComponent implements OnInit {
  private userLocationControl: any;
  private toastr = inject(ToastrService);
  private director = inject(DirectorService);
  private isProgrammaticPanAndZoom: boolean = false;
  private mapControllerService = inject(MapControllerService);
  map: google.maps.Map | null = null;
  mapOptions: google.maps.MapOptions = {
    mapId: '53da1ad002655c53',
    center: { lat: 21.3069, lng: -157.8583 },
    zoom: 12,
    gestureHandling: 'greedy',
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  private cameraModeSubscription!: Subscription;

  mapReady$ = new BehaviorSubject<google.maps.Map | null>(null);
  stopsAndMapEventsSubscription!: Subscription;
  vehiclesSubscription!: Subscription;
  userLocationSubscription!: Subscription;

  private markerService = inject(MarkerService);
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

            if (isMobile) {
              // Ensure drawer height is reasonable (not negative, not larger than viewport)
              const safeDrawerHeight = Math.max(0, Math.min(drawerHeight, viewportHeight * 0.8));
              const mapHeight = Math.max(100, viewportHeight - safeDrawerHeight); // Minimum 100px for map
              this.map.getDiv().style.height = `${mapHeight}px`;
            } else {
              this.map.getDiv().style.height = `${viewportHeight}px`;
            }
          }
        }
      );
    });
  }

  onMapReady(event: google.maps.Map | Event) {
    const map = event as google.maps.Map;
    this.map = map;
    this.map.setOptions(this.mapOptions);
    this.markerService.init(map);
    this.mapReady$.next(map);
    this.director.setMap(map);

    this.mapControllerService.setController({
      zoom$: this.mapControllerService.zoom$,
      mapElement: this.map.getDiv(),
      panAndZoom: (center, zoom) => this.panAndZoom(center, zoom),
      fitBounds: (bounds, padding) => this.fitBounds(bounds, padding),
      getBounds: () => this.map?.getBounds(),
      updateZoom: (zoom) => this.updateZoom(zoom),
      getZoom: () => this.getZoom(),
    });

    // Handle user-initiated interactions
    const handleUserInteraction = () => {
      this.mapControllerService.updateZoom(this.map?.getZoom());

      if (!this.isProgrammaticPanAndZoom) {
        this.mapControllerService.emitMapEvent();
        this.director.setFreeFormMode();
      }
    };

    // Add location button
    this.createLocationButton(map);

    // Add vehicle markers
    firstValueFrom(this.store.select(selectVehicleEntities)).then((vehicles) => {
      this.markerService.updateVehicleMarkers(vehicles);
    });

    // Track zoom operations
    map.addListener('zoom_changed', () => {
      handleUserInteraction();
    });

    // Track drag operations
    map.addListener('dragstart', () => {
      handleUserInteraction();
    });

    map.addListener('dragend', () => {
      handleUserInteraction();
    });

    map.addListener('idle', () => {
      this.isProgrammaticPanAndZoom = false;
    });
  }

  private createLocationButton(map: google.maps.Map) {
    this.userLocationControl = document.createElement('button');
    this.userLocationControl.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C13.3807 11.5 14.5 10.3807 14.5 9C14.5 7.61929 13.3807 6.5 12 6.5C10.6193 6.5 9.5 7.61929 9.5 9C9.5 10.3807 10.6193 11.5 12 11.5Z" fill="currentColor"/>
      </svg>
    `;

    Object.assign(this.userLocationControl.style, {
      backgroundColor: '#fff',
      border: 'none',
      borderRadius: '50%',
      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      cursor: 'pointer',
      width: '40px',
      height: '40px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#666',
      zIndex: '1000', // Ensure it appears above the map
      margin: '10px 10px', // Add margin to control spacing
    });

    // Add click handler
    this.userLocationControl.addEventListener('click', () => {
      this.store
        .select(selectUserLocation)
        .pipe(take(1))
        .subscribe((loc) => {
          if (!loc?.latitude || !loc?.longitude) {
            this.toastr.error('Location not available. Please enable location services.');
            return;
          }
          this.director.setUserMode();
        });
      this.mapControllerService.emitMapEvent();
    });

    // Add to map controls
    try {
      const controlPosition = google.maps.ControlPosition.RIGHT_BOTTOM; // Align with Google controls
      map.controls[controlPosition].push(this.userLocationControl);
    } catch (error) {
      console.warn('Failed to add location control to map:', error);
    }

    // Track mode changes
    this.cameraModeSubscription = this.director.mode$.subscribe((mode) => {
      if (mode === CameraMode.USER) {
        this.userLocationControl.classList.add('user-mode-active');
      } else {
        this.userLocationControl.classList.remove('user-mode-active');
      }
    });
  }

  panAndZoom(newCenter: google.maps.LatLngLiteral, newZoom: number = 15): void {
    if (this.map) {
      this.isProgrammaticPanAndZoom = true;

      // Execute pan and zoom
      this.map.panTo(newCenter);
      this.map.setZoom(newZoom);
    }

    setTimeout(() => {
      this.isProgrammaticPanAndZoom = false;

      this.mapControllerService.emitMapEvent();
    }, 500);
  }

  getZoom(): number | undefined {
    return this.map?.getZoom();
  }

  updateZoom(zoom: number | undefined): void {
    if (this.map && zoom) {
      this.isProgrammaticPanAndZoom = true;
      this.map.setZoom(zoom);
    }
  }

  fitBounds(
    bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral,
    padding?: number | google.maps.Padding
  ): void {
    if (this.map) {
      this.isProgrammaticPanAndZoom = true;

      padding ? this.map.fitBounds(bounds, padding) : this.map.fitBounds(bounds);

      // Emit map event after fit bounds to update markers
      setTimeout(() => {
        this.isProgrammaticPanAndZoom = false;
        this.mapControllerService.emitMapEvent();
      }, 500);
    }
  }

  ngOnDestory() {
    this.cameraModeSubscription?.unsubscribe();
  }
}
