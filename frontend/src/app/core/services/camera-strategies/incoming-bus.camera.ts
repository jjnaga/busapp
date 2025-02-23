import { inject, Injectable, Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, combineLatest, of } from 'rxjs';
import { filter, debounceTime, switchMap, map as rxMap } from 'rxjs/operators';
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
            !!value[0] && value[0].stopLat !== null && value[0].stopLon !== null && value[1] !== null
        ),
        switchMap(([stop, arrivalIndex]) => {
          const stopCoords = {
            lat: stop.stopLat!,
            lng: stop.stopLon!,
          };
          const busCoords$ = this.mapViewportService.getBusCoordinates(stop, arrivalIndex);
          if (!busCoords$) return of(null);
          return combineLatest([of(stopCoords), busCoords$]);
        }),
        filter((coords): coords is [google.maps.LatLngLiteral, google.maps.LatLngLiteral] => coords !== null),
        debounceTime(500),
        rxMap(([stopCoords, busCoords]) => {
          const bounds = this.mapViewportService.computeBounds(stopCoords, busCoords);

          this.mapController?.fitBounds(bounds, {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          });
          return null;
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
