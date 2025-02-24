import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, firstValueFrom } from 'rxjs';
import { distinctUntilChanged, filter, startWith, tap, withLatestFrom } from 'rxjs/operators';
import { FreeFormCameraStrategy } from '../services/camera-strategies/free.camera';
import { UserCameraStrategy } from '../services/camera-strategies/user.camera';
import { IncomingBusCameraStrategy } from '../services/camera-strategies/incoming-bus.camera';
import { CameraStrategy, Stop } from '../utils/global.types';
import { Store } from '@ngrx/store';
import { MapControllerService } from './maps/map-controller.service';
import { selectVehicleById, selectVehicleEntities } from '../state/lib/vehicles/vehicles.selectors';
import { selectAllStops, selectSelectedStop } from '../state/lib/stops/stops.selectors';
import { selectSelectedArrivalIndex } from '../state/lib/user/user.selectors';
import { MarkerService } from './markers/marker.service';
import { isValidCoordinate } from '../utils/utils';

export enum CameraMode {
  FREE_FORM = 'FREE_FORM',
  USER = 'USER',
  INCOMING_BUS = 'INCOMING_BUS',
}

@Injectable({
  providedIn: 'root',
})
export class DirectorService {
  private store = inject(Store);
  // Inject the camera strategies.
  private freeFormCameraStrategy = inject(FreeFormCameraStrategy);
  private userCameraStrategy = inject(UserCameraStrategy);
  private incomingBusCameraStrategy = inject(IncomingBusCameraStrategy);
  private markerService = inject(MarkerService);

  // Manage the camera mode.
  private modeSubject: BehaviorSubject<CameraMode> = new BehaviorSubject<CameraMode>(CameraMode.FREE_FORM);
  public mode$ = this.modeSubject.asObservable();
  private currentMode: CameraMode = CameraMode.FREE_FORM;
  private currentStrategy: CameraStrategy = this.freeFormCameraStrategy;
  private mapController = inject(MapControllerService);

  // Subject to hold the map when it's ready.
  private mapReadySubject: BehaviorSubject<google.maps.Map | null> = new BehaviorSubject<google.maps.Map | null>(null);

  constructor() {
    // Subscribe to mode changes.
    this.mode$.pipe(distinctUntilChanged()).subscribe((mode) => {
      this.currentStrategy.cleanup();

      switch (mode) {
        case CameraMode.USER:
          this.currentStrategy = this.userCameraStrategy;
          break;
        case CameraMode.INCOMING_BUS:
          this.currentStrategy = this.incomingBusCameraStrategy;
          break;
        default:
          this.currentStrategy = this.freeFormCameraStrategy;
      }
      this.currentMode = mode;

      // If the map is already ready, execute the new strategy.
      const map = this.mapReadySubject.getValue();

      if (map) {
        this.currentStrategy.execute(this.mapController);
      }
    });
  }

  setMap(map: google.maps.Map): void {
    this.mapReadySubject.next(map);

    // default to free mode
    this.setFreeFormMode();

    this.startVehiclesMarkerManager();
    this.startStopsMarkerManager();
  }

  startVehiclesMarkerManager(): void {
    combineLatest([
      this.store.select(selectSelectedStop).pipe(startWith(undefined)),
      this.store.select(selectSelectedArrivalIndex).pipe(startWith(null)),
    ]).subscribe(([selectedStop, arrivalIndex]) => {
      // below is not used -- there will be an interval between selected stops where the arrivals loading will
      // jump the if statement. more lasting fix is to have a loading state for the arrivals
      // if (arrivalIndex !== null && selectedStop?.arrivals?.[arrivalIndex]?.vehicle) {
      const vehicleNumber =
        selectedStop?.arrivals && arrivalIndex !== null ? selectedStop?.arrivals?.[arrivalIndex]?.vehicle : null;

      if (vehicleNumber) {
        firstValueFrom(this.store.select(selectVehicleById(vehicleNumber))).then((vehicle) => {
          if (vehicle) {
            this.markerService.updateVehicleMarkers({ [vehicleNumber]: vehicle });
          }
        });
      } else {
        firstValueFrom(this.store.select(selectVehicleEntities)).then((vehicles) => {
          this.markerService.updateVehicleMarkers(vehicles);
        });
      }
    });
  }

  startStopsMarkerManager(): void {
    combineLatest([
      this.store.select(selectSelectedStop),
      this.store.select(selectSelectedArrivalIndex),
      this.mapController.mapEvents$,
    ]).subscribe(([selectedStop, arrivalIndex]) => {
      if (arrivalIndex !== null && selectedStop?.arrivals?.[arrivalIndex]?.vehicle) {
        this.markerService.updateStopMarkers({ [selectedStop.stopId]: selectedStop });
      } else {
        firstValueFrom(this.store.select(selectAllStops)).then((stops) => {
          let zoom = this.mapController.getZoom();

          if (zoom == undefined) return;
          if (zoom < 16) {
            this.markerService.updateStopMarkers({});
            return;
          }

          const bounds = this.mapController.getBounds();

          if (bounds === undefined) {
            this.markerService.updateStopMarkers({});
            return;
          }

          const filteredStops: { [stopId: string]: Stop } = {};
          Object.entries(stops).forEach(([stopNumber, stop]) => {
            if (stop && stop.stopLat && stop.stopLon && bounds.contains({ lat: stop.stopLat!, lng: stop.stopLon! })) {
              filteredStops[stop.stopId] = stop;
            }
          });

          this.markerService.updateStopMarkers(filteredStops);
        });
      }
    });
  }

  setMode(mode: CameraMode): void {
    if (mode !== this.currentMode) {
      this.modeSubject.next(mode);
    }
  }

  setFreeFormMode(): void {
    this.setMode(CameraMode.FREE_FORM);
  }
  setUserMode(): void {
    this.setMode(CameraMode.USER);
  }
  setIncomingBusMode(): void {
    this.setMode(CameraMode.INCOMING_BUS);
  }
}
