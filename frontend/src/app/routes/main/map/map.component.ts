import { Component, OnDestroy, OnInit } from '@angular/core';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Subscription, Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { filter, startWith } from 'rxjs/operators';
import { Stop, Vehicle, VehicleMap } from '../../../core/utils/global.types';
import { MarkerService } from '../../../core/services/marker.service';
import { Store } from '@ngrx/store';
import { selectAllStops } from '../../../core/state/lib/stops/stops.selectors';
import { selectAllVehicles } from '../../../core/state/lib/vehicles/vehicles.selectors';

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
  };
  stops$: Observable<Stop[]> = this.store.select(selectAllStops);
  vehicles$: Observable<VehicleMap> = this.store.select(selectAllVehicles);

  private mapEvents$ = new Subject<void>();
  private mapReady$ = new BehaviorSubject<google.maps.Map | null>(null);
  stopsAndMapEventsSubscription!: Subscription;
  vehiclesSubscription!: Subscription;

  constructor(private markerService: MarkerService, private toastrService: ToastrService, private store: Store) {}

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

  // Dummy function to simulate fetching updated vehicle data.
  fetchUpdatedVehicles(): Vehicle[] {
    // Return your updated vehicle data here.
    return [];
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
