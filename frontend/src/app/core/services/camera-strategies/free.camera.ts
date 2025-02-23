import { Injectable } from '@angular/core';
import { CameraStrategy } from '../../utils/global.types';

@Injectable({
  providedIn: 'root',
})
export class FreeFormCameraStrategy implements CameraStrategy {
  execute(map: google.maps.Map): void {
    // do nothing, user has control
    return;
  }

  cleanup(): void {}
}
