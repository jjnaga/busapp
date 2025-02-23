import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { FreeFormCameraStrategy } from '../services/camera-strategies/free.camera';
import { UserCameraStrategy } from '../services/camera-strategies/user.camera';
import { IncomingBusCameraStrategy } from '../services/camera-strategies/incoming-bus.camera';
import { CameraStrategy } from '../utils/global.types';

export enum CameraMode {
  FREE_FORM = 'FREE_FORM',
  USER = 'USER',
  INCOMING_BUS = 'INCOMING_BUS',
}

@Injectable({
  providedIn: 'root',
})
export class DirectorService {
  // Inject the camera strategies.
  private freeFormCameraStrategy = inject(FreeFormCameraStrategy);
  private userCameraStrategy = inject(UserCameraStrategy);
  private incomingBusCameraStrategy = inject(IncomingBusCameraStrategy);

  // Manage the camera mode.
  private modeSubject: BehaviorSubject<CameraMode> = new BehaviorSubject<CameraMode>(CameraMode.FREE_FORM);
  public mode$ = this.modeSubject.asObservable();
  private currentMode: CameraMode = CameraMode.FREE_FORM;
  private currentStrategy: CameraStrategy = this.freeFormCameraStrategy;

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
        this.currentStrategy.execute(map);
      }
    });

    this.mapReadySubject
      .pipe(
        filter((map): map is google.maps.Map => map !== null),
        distinctUntilChanged()
      )
      .subscribe((map) => {
        this.currentStrategy.execute(map);
      });
  }

  setMap(map: google.maps.Map): void {
    this.mapReadySubject.next(map);
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
