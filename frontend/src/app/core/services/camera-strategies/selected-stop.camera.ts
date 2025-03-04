import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, distinctUntilKeyChanged } from 'rxjs/operators';
import { CameraStrategy, Stop } from '../../utils/global.types';
import { selectSelectedStop } from '../../state/lib/stops/stops.selectors';
import { MapControllerService } from '../maps/map-controller.service';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SelectedStopStrategy implements CameraStrategy {
  private FOCUSED_ZOOM_LEVEL = 16;
  private store = inject(Store);
  private mapController = inject(MapControllerService);
  private subscription?: Subscription;

  execute(): void {
    // Clean up existing subscription
    this.cleanup();

    // Get one valid selected stop with coordinates, but only react on stop ID changes
    this.subscription = this.store
      .select(selectSelectedStop)
      .pipe(
        // Make sure we have a valid stop with coordinates
        filter((stop): stop is Stop => !!stop && stop.stopLat !== null && stop.stopLon !== null),

        // Only emit when stopId changes (not when other stop data like arrivals updates)
        distinctUntilKeyChanged('stopId')
      )
      .subscribe((selectedStop) => {
        const latLng: google.maps.LatLngLiteral = { lat: selectedStop.stopLat!, lng: selectedStop.stopLon! };
        this.mapController.panAndZoom(latLng, this.FOCUSED_ZOOM_LEVEL);
      });
  }

  cleanup(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  }
}
