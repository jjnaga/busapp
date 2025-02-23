import { inject, Injectable, Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, combineLatest, of } from 'rxjs';
import { filter, debounceTime, switchMap, map as rxMap, distinct, distinctUntilChanged } from 'rxjs/operators';
import { CameraStrategy, MAP_CONTROLLER, MapController, Stop } from '../../utils/global.types';
import { MapViewportService } from '../map-viewport.service';
import { selectSelectedStop } from '../../state/lib/stops/stops.selectors';
import { selectSelectedArrivalIndex } from '../../state/lib/user/user.selectors';
import { MapControllerService } from '../map-controller.service';

@Injectable({
  providedIn: 'root',
})
export class IncomingBusCameraStrategy implements CameraStrategy {
  private mapViewportService = inject(MapViewportService);
  private store = inject(Store);
  private mapController = inject(MapControllerService);
  private subscription?: Subscription;

  execute(): void {
    // Clean up any previous subscription.
    this.cleanup();

    this.subscription = combineLatest([
      this.store.select(selectSelectedStop),
      this.store.select(selectSelectedArrivalIndex),
    ])
      .pipe(
        filter(
          (value): value is [Stop, number] =>
            value[0] !== undefined &&
            value[0].stopLat !== null &&
            value[0].stopLon !== null &&
            value[1] !== null &&
            value[0].arrivals?.[value[1]].latitude !== null &&
            value[0].arrivals?.[value[1]].longitude !== null
        ),
        debounceTime(500),
        switchMap(([selectedStop, selectedArrivalIndex]) => {
          console.log('this should work', selectedStop);
          const selectedStopCoordinates = { lat: selectedStop.stopLat!, lng: selectedStop.stopLon! };
          const arrivalCoordinates = {
            lat: selectedStop.arrivals![selectedArrivalIndex].latitude!,
            lng: selectedStop.arrivals![selectedArrivalIndex].longitude!,
          };

          const bounds = this.mapViewportService.computeBounds(selectedStopCoordinates, arrivalCoordinates);

          this.mapController?.fitBounds(bounds, {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          });

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
