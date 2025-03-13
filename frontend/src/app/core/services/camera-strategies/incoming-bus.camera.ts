import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, combineLatest, of } from 'rxjs';
import { filter, debounceTime, switchMap, withLatestFrom, map } from 'rxjs/operators';
import { CameraStrategy, Stop } from '../../utils/global.types';
import { selectSelectedStop } from '../../state/lib/stops/stops.selectors';
import { selectSelectedVehicle } from '../../state/lib/user/user.selectors';
import { selectVehicleById } from '../../state/lib/vehicles/vehicles.selectors';
import { MapControllerService } from '../maps/map-controller.service';
import { isValidCoordinate } from '../../utils/utils';
import { MapLayoutService } from '../maps/map-layout.service';

@Injectable({
  providedIn: 'root',
})
export class IncomingBusCameraStrategy implements CameraStrategy {
  private store = inject(Store);
  private mapController = inject(MapControllerService);
  private mapLayout = inject(MapLayoutService);
  private subscription?: Subscription;

  execute(): void {
    // Clean up any previous subscription
    this.cleanup();

    this.subscription = combineLatest([this.store.select(selectSelectedStop), this.store.select(selectSelectedVehicle)])
      .pipe(
        // Only proceed if we have valid stop and vehicle ID
        filter(
          ([stop, vehicleId]) =>
            !!stop &&
            !!vehicleId &&
            stop.stopLat !== null &&
            stop.stopLon !== null &&
            isValidCoordinate(stop.stopLat, stop.stopLon)
        ),
        // Switch to a stream that combines stop info with latest vehicle data
        switchMap(([selectedStop, vehicleId]) => {
          // Now get the actual vehicle entity which will update when websocket updates come in
          return combineLatest([of(selectedStop), this.store.select(selectVehicleById(vehicleId!))]).pipe(
            debounceTime(300), // Debounce to avoid too many recalculations when bus is moving
            withLatestFrom(this.mapLayout.visibleDrawerHeight$),
            map(([[stop, vehicle], drawerHeight]) => ({ stop, vehicle, drawerHeight })),
            filter(
              (data): data is { stop: Stop; vehicle: any; drawerHeight: number } =>
                !!data.stop &&
                !!data.vehicle &&
                isValidCoordinate(data.stop.stopLat!, data.stop.stopLon!) &&
                isValidCoordinate(data.vehicle.latitude!, data.vehicle.longitude!)
            )
          );
        }),
        // Process the data to update the map view
        switchMap(({ stop, vehicle, drawerHeight }) => {
          // Define points for stop and bus
          const stopPoint = {
            lat: stop.stopLat!,
            lng: stop.stopLon!,
          };

          const busPoint = {
            lat: vehicle.latitude!,
            lng: vehicle.longitude!,
          };

          // Calculate and apply optimal view
          const { center, zoom } = this.mapController.calculateOptimalView(stopPoint, busPoint);

          this.mapController.panAndZoom(center, zoom);
          return of(null);
        })
      )
      .subscribe();
  }

  cleanup(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  }
}
