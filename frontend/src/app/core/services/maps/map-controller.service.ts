// src/app/core/services/map-controller.service.ts
import { Injectable } from '@angular/core';
import { MapController } from '../../utils/global.types';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MapControllerService implements MapController {
  // Maximum zoom level to prevent excessive zooming
  // Value of 17 provides good detail while maintaining context on a mobile device
  public static readonly MAX_ZOOM = 17;

  // Minimum padding (in pixels) to ensure points aren't too close to edge
  public static readonly MIN_PADDING = 15;

  private mapController: MapController | null = null;
  private mapEvents = new Subject<void>();
  private currentZoom = new BehaviorSubject<number | undefined>(undefined); // Default zoom level
  public zoom$ = this.currentZoom.asObservable();

  public mapEvents$ = this.mapEvents.asObservable();

  fitBounds(bounds: google.maps.LatLngBounds, padding?: number | google.maps.Padding): void {
    this.mapController?.fitBounds(bounds, padding);
  }

  panAndZoom(center: google.maps.LatLngLiteral, zoom: number): void {
    // Apply max zoom limit
    const limitedZoom = Math.min(zoom, MapControllerService.MAX_ZOOM);
    this.mapController?.panAndZoom(center, limitedZoom);
  }

  // Calculate optimal view settings for two points
  // Returns the center point and appropriate zoom level
  calculateOptimalView(
    point1: google.maps.LatLngLiteral,
    point2: google.maps.LatLngLiteral,
    viewportWidth: number,
    viewportHeight: number
  ): { center: google.maps.LatLngLiteral; zoom: number } {
    // Calculate center between two points
    const center = {
      lat: (point1.lat + point2.lat) / 2,
      lng: (point1.lng + point2.lng) / 2,
    };

    // Calculate distance between points (in meters)
    const distance = this.calculateDistance(point1, point2);

    // Determine orientation by comparing lat/lng differences
    const latDiff = Math.abs(point1.lat - point2.lat);
    const lngDiff = Math.abs(point1.lng - point2.lng);

    // Convert lng difference to approximate meters at this latitude
    // (longitude spans vary by latitude)
    const lngDistanceApprox = this.calculateLongitudeDistance(center.lat, lngDiff);
    const latDistanceApprox = this.calculateLatitudeDistance(latDiff);

    // Determine if the points are mostly east-west or north-south
    const isEastWestOriented = lngDistanceApprox > latDistanceApprox;

    // Calculate viewport aspect ratio
    const aspectRatio = viewportWidth / viewportHeight;

    // Base zoom and adjustment factors
    const baseZoom = 15.5; // Slightly higher base zoom for better detail

    // Apply zoom adjustment based on orientation and aspect ratio
    let zoomFactor;
    if (isEastWestOriented) {
      // East-west oriented points need more zoom on typical portrait mobile screens
      // We'll use a larger factor for the denominator to zoom in more
      zoomFactor = 800;

      // If the screen is very narrow, zoom in even more
      if (aspectRatio < 0.6) zoomFactor = 700;
    } else {
      // North-south oriented points work better with the original formula
      zoomFactor = 1000;
    }

    // Calculate zoom with our orientation-aware factor
    const zoomAdjustment = Math.log2(zoomFactor / Math.max(distance, MapControllerService.MIN_PADDING));
    let zoom = baseZoom + zoomAdjustment;

    // Ensure zoom is within reasonable bounds
    zoom = Math.min(zoom, MapControllerService.MAX_ZOOM);
    zoom = Math.max(zoom, 13); // Don't zoom out too far

    return { center, zoom: Math.round(zoom) };
  }

  // Calculate distance in meters for a latitude difference
  private calculateLatitudeDistance(latDiff: number): number {
    // One degree of latitude is approximately 111,000 meters
    return latDiff * 111000;
  }

  // Calculate distance in meters for a longitude difference at a given latitude
  private calculateLongitudeDistance(latitude: number, lngDiff: number): number {
    // Length of a degree of longitude varies by latitude
    // At the equator it's about 111,000 meters, decreasing to 0 at the poles
    // yea AI better than us at this
    const metersPerDegree = Math.cos((latitude * Math.PI) / 180) * 111000;
    return lngDiff * metersPerDegree;
  }

  // Calculate distance between two points using Haversine formula (in meters)
  private calculateDistance(point1: google.maps.LatLngLiteral, point2: google.maps.LatLngLiteral): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
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
