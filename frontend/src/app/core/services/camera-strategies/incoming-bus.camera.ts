import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, combineLatest, of } from 'rxjs';
import { filter, debounceTime, switchMap } from 'rxjs/operators';
import { CameraStrategy, Stop } from '../../utils/global.types';
import { selectSelectedStop } from '../../state/lib/stops/stops.selectors';
import { selectSelectedArrivalIndex } from '../../state/lib/user/user.selectors';
import { MapControllerService } from '../maps/map-controller.service';
import { isValidCoordinate } from '../../utils/utils';

@Injectable({
  providedIn: 'root',
})
export class IncomingBusCameraStrategy implements CameraStrategy {
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
            value[0].arrivals !== undefined &&
            isValidCoordinate(value[0].stopLat, value[0].stopLon) &&
            isValidCoordinate(value[0].arrivals[value[1]].latitude!, value[0].arrivals[value[1]].longitude!)
        ),
        debounceTime(500),
        switchMap(([selectedStop, selectedArrivalIndex]) => {
          const selectedStopCoordinates = { lat: selectedStop.stopLat!, lng: selectedStop.stopLon! };
          const arrivalCoordinates = {
            lat: selectedStop.arrivals![selectedArrivalIndex].latitude!,
            lng: selectedStop.arrivals![selectedArrivalIndex].longitude!,
          };

          const bounds = new google.maps.LatLngBounds();
          bounds.extend(selectedStopCoordinates);
          bounds.extend(arrivalCoordinates);

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
