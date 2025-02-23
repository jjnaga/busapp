import { Store } from '@ngrx/store';
import { selectUserLocation } from '../../state/lib/user-location/user-location.selectors';
import { CameraStrategy } from '../../utils/global.types';
import { inject, Injectable } from '@angular/core';
import { filter, Subscription, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserCameraStrategy implements CameraStrategy {
  private subscription?: Subscription;
  private store = inject(Store);

  execute(map: google.maps.Map): void {
    // Subscribe to user location once and adjust the camera.
    this.subscription = this.store
      .select(selectUserLocation)
      .pipe(
        filter((loc) => loc && loc.latitude !== null && loc.longitude !== null),
        take(1)
      )
      .subscribe((loc) => {
        const newCenter = { lat: loc.latitude!, lng: loc.longitude! };
        map.panTo(newCenter);
        map.setZoom(17);
      });
  }

  cleanup(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  }
}
