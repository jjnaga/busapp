import { Injectable } from '@angular/core';
import { Stop, Vehicle } from '../utils/global.types';
import { Store } from '@ngrx/store';
import { setSelectedStop } from '../state/lib/user/user.actions';

@Injectable({
  providedIn: 'root',
})
export class MarkerService {
  private map: google.maps.Map | null = null;
  // key is stopId, value is the marker element.
  private stopMarkers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map();
  // key is vehicleId, value is the marker element.
  private vehicleMarkers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map();

  constructor(private store: Store) {}

  init(map: google.maps.Map) {
    this.map = map;
  }

  updateStopMarkers(stops: Stop[], minZoomLevel: number) {
    if (!this.map) {
      console.error('MarkerService: Map not initialized.');
      return;
    }
    const currentZoom = this.map.getZoom();
    if (!currentZoom || currentZoom < minZoomLevel) {
      this.clearStopMarkers();
      return;
    }

    const bounds = this.map.getBounds();
    if (!bounds) return;

    // Remove markers for stops that are now outside the viewport.
    this.stopMarkers.forEach((marker, stopId) => {
      if (!marker.position || !bounds.contains(marker.position)) {
        marker.remove();
        this.stopMarkers.delete(stopId);
      }
    });

    // Add markers for stops inside the viewport.
    stops.forEach((stop) => {
      if (stop.stopLat === null || stop.stopLon === null) return;

      const position = new google.maps.LatLng(stop.stopLat, stop.stopLon);
      if (!bounds.contains(position)) return;

      if (!this.stopMarkers.has(stop.stopId)) {
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: this.map,
          position: { lat: stop.stopLat, lng: stop.stopLon },
          title: stop.stopName || 'Bus Stop',
          content: this.createStopMarkerContent(stop),
        });

        marker.addListener('click', () => {
          console.log('Stop marker clicked:', stop);
          this.store.dispatch(setSelectedStop({ stop }));
        });

        this.stopMarkers.set(stop.stopId, marker);
      }
    });
  }

  private createStopMarkerContent(stop: Stop): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('custom-marker');
    div.innerHTML = `
      <div class="marker-container ${true ? 'favorite' : ''}">
        <img src="${false ? 'star-marker.svg' : 'bus-stop-marker.svg'}" class="marker-icon" />
      </div>
    `;
    return div;
  }

  clearStopMarkers() {
    this.stopMarkers.forEach((marker) => {
      marker.remove();
    });
    this.stopMarkers.clear();
  }

  updateVehicleMarkers(vehicles: Vehicle[], minZoomLevel: number) {
    if (!this.map) {
      console.error('MarkerService: Map not initialized.');
      return;
    }

    // Update existing vehicle markers.
    this.vehicleMarkers.forEach((marker, vehicleId) => {
      // Look for updated data for this vehicle.
      const vehicle = vehicles.find((v) => v.tripId === vehicleId);

      if (!vehicle) {
        // Vehicle no longer in data: remove marker.
        marker.remove();
        this.vehicleMarkers.delete(vehicleId);
        return;
      }

      const newPosition = { lat: vehicle.latitude, lng: vehicle.longitude };
      // Update marker position only if changed.
      if (!marker.position || marker.position.lat !== newPosition.lat || marker.position.lng !== newPosition.lng) {
        marker.position = newPosition;
      }
      // // Optionally, remove marker if it’s moved outside the viewport.
      // if (
      //   !bounds.contains(
      //     new google.maps.LatLng(newPosition.lat, newPosition.lng)
      //   )
      // ) {
      //   marker.remove();
      //   this.vehicleMarkers.delete(vehicleId);
      // }
    });

    // Add new markers for vehicles that are visible and not already added.
    vehicles.forEach((vehicle) => {
      if (this.vehicleMarkers.has(vehicle.tripId)) return;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: this.map,
        position: { lat: vehicle.latitude, lng: vehicle.longitude },
        title: `Vehicle ${vehicle.busNumber}`,
        content: this.createVehicleMarkerContent(vehicle),
      });

      marker.addListener('click', () => {
        console.log('Vehicle marker clicked:', vehicle);
        // Handle vehicle marker click as needed.
      });

      console.log('this should be good?', vehicle, marker);
      this.vehicleMarkers.set(vehicle.tripId, marker);
    });
  }

  private createVehicleMarkerContent(vehicle: Vehicle): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('custom-marker');
    div.innerHTML = `
      <div class="marker-container">
        <img src="bus.png" alt="Vehicle Marker" class="marker-icon-vehicle" />
      </div>
    `;
    return div;
  }

  clearVehicleMarkers() {
    this.vehicleMarkers.forEach((marker) => {
      marker.remove();
    });
    this.vehicleMarkers.clear();
  }

  /**
   * Clear all markers (stops and vehicles) from the map.
   */
  clearAllMarkers() {
    this.clearStopMarkers();
    this.clearVehicleMarkers();
  }
}
