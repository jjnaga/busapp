import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, combineLatest, of } from 'rxjs';
import { filter, debounceTime, switchMap, withLatestFrom } from 'rxjs/operators';
import { CameraStrategy, Stop } from '../../utils/global.types';
import { selectSelectedStop } from '../../state/lib/stops/stops.selectors';
import { selectSelectedVehicle } from '../../state/lib/user/user.selectors';
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
        // Only proceed if we have valid stop and vehicle data
        filter(
          (value): value is [Stop, string] =>
            !!value[0] &&
            !!value[1] &&
            value[0].stopLat !== null &&
            value[0].stopLon !== null &&
            isValidCoordinate(value[0].stopLat, value[0].stopLon)
        ),
        // Add a small delay to avoid rapid calculations during transitions
        debounceTime(500),
        // Get the current drawer height to calculate viewport
        withLatestFrom(this.mapLayout.visibleDrawerHeight$),
        switchMap(([[selectedStop, selectedVehicle], drawerHeight]) => {
          // Find the arrival with the matching vehicle ID
          const selectedArrival = selectedStop.arrivals?.find((a) => a.vehicle === selectedVehicle);

          if (!selectedArrival || !isValidCoordinate(selectedArrival.latitude!, selectedArrival.longitude!)) {
            return of(null); // Skip if we don't have valid coordinates
          }

          // Get viewport dimensions from window and adjust for drawer
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight - drawerHeight;

          // Define points for stop and bus
          const stopPoint = {
            lat: selectedStop.stopLat!,
            lng: selectedStop.stopLon!,
          };

          const busPoint = {
            lat: selectedArrival.latitude!,
            lng: selectedArrival.longitude!,
          };

          // Calculate optimal view settings based on the two points and viewport
          const { center, zoom } = this.mapController.calculateOptimalView(
            stopPoint,
            busPoint,
            viewportWidth,
            viewportHeight
          );

          // Apply the calculated view settings
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
