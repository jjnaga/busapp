// src/app/core/services/map-controller.service.ts
import { Injectable } from '@angular/core';
import { MapController } from '../utils/global.types';

@Injectable({ providedIn: 'root' })
export class MapControllerService implements MapController {
  private mapController: MapController | null = null;

  fitBounds(bounds: google.maps.LatLngBounds, padding?: number | google.maps.Padding): void {
    this.mapController?.fitBounds(bounds, padding);
  }

  panAndZoom(center: google.maps.LatLngLiteral, zoom: number): void {
    this.mapController?.panAndZoom(center, zoom);
  }

  setController(controller: MapController): void {
    this.mapController = controller;
  }
}
