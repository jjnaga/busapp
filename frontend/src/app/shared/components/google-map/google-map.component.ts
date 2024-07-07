import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
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
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'google-map-component',
  templateUrl: './google-map.component.html',
  standalone: true,
  imports: [GoogleMap, MapAdvancedMarker, AsyncPipe],
})
export class GoogleMapComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  map: google.maps.Map | null = null;
  markers$ = new BehaviorSubject<Marker[]>([]);
  mapOptions: google.maps.MapOptions = {
    mapId: '53da1ad002655c53',
    center: { lat: 21.3069, lng: -157.8583 },
    zoom: 12,
    disableDefaultUI: true,
  };

  constructor(
    private vehiclesService: VehiclesService,
    private stopsService: StopsService,
    private ngZone: NgZone
  ) {}

  async ngOnInit() {
    await this.waitForGoogleMaps();
    this.subscribeToData();
  }

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
    combineLatest([
      this.vehiclesService.getVehiclesObservable(),
      this.stopsService.getStopsObservable(),
    ])
      .pipe(
        takeUntil(this.destroy$),
        // map(([vehicles, stops]) => this.createMarkers(vehicles, stops))
        map(([vehicles, stops]) => this.createMarkers(vehicles))
      )
      .subscribe((markers) => {
        this.markers$.next(markers);
        // if (markers.length > 0) {
        //   this.center = markers[0].position; // Center map on first marker
        // }
      });
  }

  private createMarkers(
    vehicles?: Map<string, Vehicle>,
    stops?: Stop[]
  ): Marker[] {
    let busMarkers: any[] = [];
    let stopMarkers: any[] = [];

    if (vehicles) {
      busMarkers = Array.from(vehicles.values()).map((vehicle) => {
        const imgTag = document.createElement('img');
        imgTag.src = 'assets/bus.png';
        imgTag.width = 50;
        imgTag.height = 50;

        return {
          position: { lat: vehicle.latitude, lng: vehicle.longitude },
          title: `Bus ${vehicle.busNumber}`,
          type: 'bus',
          content: imgTag,
          // This causes issues?
          // options: {
          //   // icon: imgTag,
          //   size: new google.maps.Size(32, 32),
          // },
        };
      });
    }

    if (stops) {
      stopMarkers = stops
        .filter(
          (stop): stop is Stop & { stopLat: number; stopLon: number } =>
            stop.stopLat !== null &&
            stop.stopLon !== null &&
            !isNaN(stop.stopLat) &&
            !isNaN(stop.stopLon)
        )
        .map((stop) => ({
          position: { lat: stop.stopLat, lng: stop.stopLon },
          title: stop.stopName || 'Unnamed Stop',
          type: 'stop',
        }));
    }

    return [...busMarkers, ...stopMarkers];
  }

  onMapReady(map: google.maps.Map) {
    this.map = map;
    this.map.setCenter({ lat: 21.2968, lng: -157.8531 });
    this.map.setZoom(14);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBusStopClick(marker: any): void {
    console.log('Marker clicked', marker);
    switch (marker.type) {
      case 'bus':
        console.log('bus');
        break;
      case 'stop':
        console.log('stop');
        break;
      default:
        console.log('NA');
    }
  }
}
