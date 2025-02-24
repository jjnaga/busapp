import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CameraStrategy, Stop } from '../../utils/global.types';
import { selectSelectedStop } from '../../state/lib/stops/stops.selectors';
import { MapControllerService } from '../maps/map-controller.service';

@Injectable({
  providedIn: 'root',
})
export class SelectedStopStrategy implements CameraStrategy {
  private FOCUSED_ZOOM_LEVEL = 16;
  private store = inject(Store);
  private mapController = inject(MapControllerService);

  async execute(): Promise<void> {
    // Get one valid selected stop with coordinates.
    this.store
      .select(selectSelectedStop)
      .pipe(filter((stop): stop is Stop => !!stop && stop.stopLat !== null && stop.stopLon !== null))
      .subscribe((selectedStop) => {
        const latLng: google.maps.LatLngLiteral = { lat: selectedStop.stopLat!, lng: selectedStop.stopLon! };
        this.mapController.panAndZoom(latLng, this.FOCUSED_ZOOM_LEVEL);
      });
  }

  cleanup(): void {}
}
