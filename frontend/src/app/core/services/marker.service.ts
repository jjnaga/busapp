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
  private userMarker: google.maps.marker.AdvancedMarkerElement | null = null;

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

  updateUserMarker(latitude: number, longitude: number) {
    if (!this.map) {
      console.error('MarkerService: Map not initialized.');
      return;
    }

    const position = new google.maps.LatLng(latitude, longitude);

    if (this.userMarker) {
      this.userMarker.position = position;
    } else {
      this.userMarker = new google.maps.marker.AdvancedMarkerElement({
        map: this.map,
        position: { lat: latitude, lng: longitude },
        title: 'Your Location',
        content: this.createUserMarkerContent(),
      });
    }
  }

  private createUserMarkerContent(): HTMLElement {
    const div = document.createElement('div');

    div.classList.add('custom-user-marker');
    div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="gradient" x1="32" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1e40af"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(30,64,175,0.2)"/>
    </filter>
  </defs>
  
  <g filter="url(#shadow)">
    <circle cx="32" cy="32" r="24" fill="url(#gradient)"/>
    <path fill="#fff" d="M32 22a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 18c-6.6 0-12 4.2-12 9.4 0 2.6 2.7 4.6 6 4.6h12c3.3 0 6-2 6-4.6 0-5.2-5.4-9.4-12-9.4z"/>
  </g>
</svg>`;

    return div;
  }

  clearAllMarkers() {
    this.clearStopMarkers();
    this.clearVehicleMarkers();

    if (this.userMarker) {
      this.userMarker.remove();
      this.userMarker = null;
    }
  }
}
