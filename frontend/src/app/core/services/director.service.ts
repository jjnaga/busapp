import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, firstValueFrom, Subscription, EMPTY } from 'rxjs';
import { distinctUntilChanged, startWith, tap, switchMap, filter, map } from 'rxjs/operators';
import { FreeFormCameraStrategy } from '../services/camera-strategies/free.camera';
import { UserCameraStrategy } from '../services/camera-strategies/user.camera';
import { IncomingBusCameraStrategy } from '../services/camera-strategies/incoming-bus.camera';
import { CameraStrategy, Stop } from '../utils/global.types';
import { Store } from '@ngrx/store';
import { MapControllerService } from './maps/map-controller.service';
import { selectVehicleById, selectVehicleEntities } from '../state/lib/vehicles/vehicles.selectors';
import { selectAllStops, selectSelectedStop } from '../state/lib/stops/stops.selectors';
import * as WebSocketActions from '../state/lib/websocket/websocket.actions';
import { MarkerService } from './markers/marker.service';
import { SelectedStopStrategy } from './camera-strategies/selected-stop.camera';
import { Actions, ofType } from '@ngrx/effects';
import { selectSelectedVehicle } from '../state/lib/user/user.selectors';

export enum CameraMode {
  FREE_FORM = 'FREE_FORM',
  USER = 'USER',
  INCOMING_BUS = 'INCOMING_BUS',
  SELECTED_STOP = 'SELECTED_STOP',
}

@Injectable({
  providedIn: 'root',
})
export class DirectorService implements OnDestroy {
  private MIN_ZOOM_LEVEL = 15;
  private store = inject(Store);
  // Inject the camera strategies.
  private freeFormCameraStrategy = inject(FreeFormCameraStrategy);
  private userCameraStrategy = inject(UserCameraStrategy);
  private incomingBusCameraStrategy = inject(IncomingBusCameraStrategy);
  private selectedStopCameraStrategy = inject(SelectedStopStrategy);
  private markerService = inject(MarkerService);

  // Manage the camera mode.
  private modeSubject: BehaviorSubject<CameraMode> = new BehaviorSubject<CameraMode>(CameraMode.FREE_FORM);
  public mode$ = this.modeSubject.asObservable();
  private currentMode: CameraMode = CameraMode.FREE_FORM;
  private currentStrategy: CameraStrategy = this.freeFormCameraStrategy;
  private mapController = inject(MapControllerService);

  // Subject to hold the map when it's ready.
  private mapReadySubject: BehaviorSubject<google.maps.Map | null> = new BehaviorSubject<google.maps.Map | null>(null);
  private actions$ = inject(Actions);
  private subscriptions = new Subscription();

  constructor() {
    const modeSubscription = this.mode$.pipe(distinctUntilChanged()).subscribe((mode) => {
      this.currentStrategy.cleanup();

      switch (mode) {
        case CameraMode.USER:
          this.currentStrategy = this.userCameraStrategy;
          break;
        case CameraMode.INCOMING_BUS:
          this.currentStrategy = this.incomingBusCameraStrategy;
          break;
        case CameraMode.SELECTED_STOP:
          this.currentStrategy = this.selectedStopCameraStrategy;
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
    this.subscriptions.add(modeSubscription);
  }

  setMap(map: google.maps.Map): void {
    this.mapReadySubject.next(map);

    // default to free mode
    this.setFreeFormMode();

    this.startVehiclesMarkerManager();
    this.startStopsMarkerManager();
  }

  startVehiclesMarkerManager(): void {
    const updateMarkersFromWebsocket$ = this.actions$
      .pipe(
        ofType(WebSocketActions.websocketVehiclesUpdateMessageReceived), // Listen for this specific action
        tap(({ vehicles }) => {
          this.markerService.updateVehicleCoordinates(vehicles);
        })
      )
      .subscribe();

    const showOrHideVehicleMarkers$ = combineLatest([
      this.store.select(selectSelectedStop).pipe(startWith(undefined)),
      this.store.select(selectSelectedVehicle).pipe(startWith(null)),
    ]).subscribe(([selectedStop, selectedVehicle]) => {
      // Check if the selected vehicle matches any vehicle in the arrivals
      const hasMatchingArrival = selectedStop?.arrivals?.some((arrival) => arrival.vehicle === selectedVehicle);

      // If there's a matching arrival and a selected vehicle, update just that vehicle marker
      if (hasMatchingArrival && selectedVehicle) {
        firstValueFrom(this.store.select(selectVehicleById(selectedVehicle))).then((vehicle) => {
          if (vehicle) {
            this.markerService.updateVehicleMarkers({ [selectedVehicle]: vehicle });
          }
        });
      } else {
        // Otherwise, show all vehicles
        firstValueFrom(this.store.select(selectVehicleEntities)).then((vehicles) => {
          this.markerService.updateVehicleMarkers(vehicles);
        });
      }
    });

    // Add subscription to handle route shape display when a vehicle is selected
    const vehicleShapeSubscription = this.store
      .select(selectSelectedVehicle)
      .pipe(
        switchMap((vehicleId) => {
          if (!vehicleId) {
            this.markerService.clearRouteShape();
            return EMPTY;
          }

          return this.store.select(selectVehicleById(vehicleId)).pipe(
            filter((vehicle) => !!vehicle && !!vehicle.routeShape),
            map((vehicle) => vehicle?.routeShape)
          );
        })
      )
      .subscribe((routeShape) => {
        if (routeShape) {
          this.markerService.displayRouteShape(routeShape);
        }
      });

    this.subscriptions.add(vehicleShapeSubscription);
    this.subscriptions.add(showOrHideVehicleMarkers$);
    this.subscriptions.add(updateMarkersFromWebsocket$);
  }

  // Based on selected stop and arrival index, update the stop markers and move the camera to the stop
  // or set the incoming vehicle camera strategy.
  startStopsMarkerManager(): void {
    // should this be in stops.effects.ts?
    const stopMarkerSubscription = combineLatest([
      this.store.select(selectSelectedStop).pipe(startWith(null)),
      this.store.select(selectSelectedVehicle).pipe(startWith(null)),
      this.mapController.mapEvents$.pipe(startWith(null)),
    ]).subscribe(([selectedStop, selectedVehicle]) => {
      if (!!selectedStop && !!selectedVehicle) {
        this.markerService.updateStopMarkers({ [selectedStop.stopId]: selectedStop });
      } else {
        firstValueFrom(this.store.select(selectAllStops)).then((stops) => {
          let zoom = this.mapController.getZoom();

          if (zoom == undefined) return;

          if (zoom && zoom < this.MIN_ZOOM_LEVEL) {
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

    this.subscriptions.add(stopMarkerSubscription);
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

  setSelectedStopMode(): void {
    this.setMode(CameraMode.SELECTED_STOP);
  }

  getCurrentMode(): CameraMode {
    return this.currentMode;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
