import { Injectable } from '@angular/core';
import { Stop, Vehicle, VehicleMap } from '../utils/global.types';
import { Store } from '@ngrx/store';
import { setSelectedStop } from '../state/lib/user/user.actions';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class MarkerService {
  private map: google.maps.Map | null = null;
  // key is stopId, value is the marker element.
  private stopMarkers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map();
  // key is busNumber, value is the marker element.
  private vehicleMarkers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map();
  constructor(private store: Store, private toastrService: ToastrService) {}

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

  updateVehicleMarkers(vehicles: VehicleMap, minZoomLevel: number) {
    if (!this.map) {
      console.error('MarkerService: Map not initialized.');
      this.toastrService.error('Map not initialized.');
      return;
    }

    // Update existing markers and add new ones
    Object.entries(vehicles).forEach(([busNumber, vehicle]) => {
      const position = new google.maps.LatLng(vehicle.latitude, vehicle.longitude);

      let marker = this.vehicleMarkers.get(busNumber);

      if (marker) {
        // Update the marker's position directly
        marker.position = position;
      } else {
        // this really shouldnt run IMO, there will not be new buses (true?)
        // this will only run at the start
        marker = new google.maps.marker.AdvancedMarkerElement({
          map: this.map,
          position: position,
          title: vehicle.headsign || 'Vehicle',
          content: this.createVehicleMarkerContent(vehicle),
        });

        // Example click listener
        marker.addListener('click', () => {
          console.log('Vehicle clicked:', vehicle);
          // Dispatch actions or show info as needed
        });

        this.vehicleMarkers.set(busNumber, marker);
      }
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
