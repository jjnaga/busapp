// src/app/core/services/map-controller.service.ts
import { Injectable } from '@angular/core';
import { MapController } from '../../utils/global.types';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MapControllerService implements MapController {
  private mapController: MapController | null = null;
  private mapEvents = new Subject<void>();
  private currentZoom = new BehaviorSubject<number | undefined>(undefined); // Default zoom level
  public zoom$ = this.currentZoom.asObservable();

  public mapEvents$ = this.mapEvents.asObservable();

  fitBounds(bounds: google.maps.LatLngBounds, padding?: number | google.maps.Padding): void {
    this.mapController?.fitBounds(bounds, padding);
  }

  panAndZoom(center: google.maps.LatLngLiteral, zoom: number): void {
    this.mapController?.panAndZoom(center, zoom);
  }

  setController(controller: MapController): void {
    this.mapController = controller;
  }

  updateZoom(zoom: number | undefined): void {
    this.currentZoom.next(zoom);
  }

  getZoom(): number | undefined {
    return this.currentZoom.value;
  }

  // New method to emit map events
  emitMapEvent(): void {
    this.mapEvents.next();
  }

  getBounds(): google.maps.LatLngBounds | undefined {
    return this.mapController?.getBounds();
  }
}
