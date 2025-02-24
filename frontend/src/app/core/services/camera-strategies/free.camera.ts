import { Injectable } from '@angular/core';
import { CameraStrategy, MapController } from '../../utils/global.types';

@Injectable({
  providedIn: 'root',
})
export class FreeFormCameraStrategy implements CameraStrategy {
  execute(mapController: MapController): void {
    // do nothing, user has control
    return;
  }

  cleanup(): void {}
}
