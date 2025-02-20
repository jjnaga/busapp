import { inject, Injectable } from '@angular/core';
import { Stop, Vehicle } from '../utils/global.types';
import { Store } from '@ngrx/store';
import { setSelectedStop } from '../state/lib/user/user.actions';
import { ToastrService } from 'ngx-toastr';
import { Dictionary } from '@ngrx/entity';
import { selectSelectedStop } from '../state/lib/user/user.selectors';
import { selectAllFavoriteIds, selectIsFavorite } from '../state/lib/favorites/favorites.selectors';

@Injectable({
  providedIn: 'root',
})
export class MarkerService {
  private store = inject(Store);
  private toastrService = inject(ToastrService);
  private map: google.maps.Map | null = null;
  private stopMarkers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map();
  private vehicleMarkers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map();
  private userMarker: google.maps.marker.AdvancedMarkerElement | null = null;

  constructor() {
    this.store.select(selectSelectedStop).subscribe((stop) => this.highlightStop(stop?.stopId || null));

    this.store.select(selectAllFavoriteIds).subscribe((favoriteIds) => {
      this.stopMarkers.forEach((marker, stopId) => {
        const isFavorite = favoriteIds.includes(stopId);
        (marker.content as HTMLElement)?.classList.toggle('favorite', isFavorite);
        (marker.content as HTMLElement).innerHTML = this.createStopSVG(marker.title || 'Bus Stop', isFavorite);
      });
    });
  }

  init(map: google.maps.Map) {
    this.map = map;
  }

  getUserMarker() {
    return this.userMarker;
  }

  private highlightStop(selectedStopId: string | null): void {
    // Reset all markers
    this.stopMarkers.forEach((marker, _stopId) => {
      (marker.content as HTMLElement)?.classList.remove('selected');
    });

    // Highlight selected
    if (selectedStopId && this.stopMarkers.has(selectedStopId)) {
      const marker = this.stopMarkers.get(selectedStopId)!;

      (marker.content as HTMLElement)?.classList.add('selected');
    }
  }

  updateStopMarkers(stops: Stop[], minZoomLevel: number) {
    if (!this.map) {
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
      // dont render stops with no lat or lng
      if (stop.stopLat === null || stop.stopLon === null) return;

      // dont render stops outside of the viewport
      const position = new google.maps.LatLng(stop.stopLat, stop.stopLon);
      if (!bounds.contains(position)) return;

      if (!this.stopMarkers.has(stop.stopId)) {
        this.store.select(selectIsFavorite(stop.stopId)).subscribe((isFavorite) => {
          const marker = new google.maps.marker.AdvancedMarkerElement({
            map: this.map,
            position: { lat: stop.stopLat!, lng: stop.stopLon! },
            title: stop.stopName || 'Bus Stop',
            content: this.createStopMarkerContent(stop, isFavorite),
          });

          marker.addListener('click', () => {
            this.store.dispatch(setSelectedStop({ stop }));

            // Update highlighting immediately on click.
            this.highlightStop(stop.stopId);
          });

          this.stopMarkers.set(stop.stopId, marker);
        });
      }
    });
  }

  private createStopMarkerContent(stop: Stop, isFavorite: boolean): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = this.createStopSVG(stop.stopName || 'Bus Stop', isFavorite);
    div.classList.add('stop-marker');
    if (isFavorite) div.classList.add('favorite');
    return div;
  }

  private createStopSVG(title: string, isFavorite: boolean): string {
    const outerCircleSize = 34;
    const innerCircleSize = 27;
    const iconSize = 16;
    const outerCircleColor = 'white';
    const innerCircleColor = isFavorite ? '#FFD700' : 'rgb(30,64,175)';
    const iconColor = 'white';

    // Calculate centers and offsets
    const center = outerCircleSize / 2;
    const innerRadius = innerCircleSize / 2;
    const iconOffset = (outerCircleSize - iconSize) / 2;

    return `
      <svg aria-label="${title}" width="${outerCircleSize}" height="${outerCircleSize}" viewBox="0 0 ${outerCircleSize} ${outerCircleSize}" xmlns="http://www.w3.org/2000/svg">
        <!-- Outer white circle for depth -->
        <circle cx="${center}" cy="${center}" r="${center}" fill="${outerCircleColor}" />
        
        <!-- Inner gray circle -->
        <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="${innerCircleColor}" />
        <svg x="${iconOffset}" y="${iconOffset}" width="${iconSize}" height="${iconSize}" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg" fill="${iconColor}">
          <path d="M288 0C422.4 0 512 35.2 512 80l0 16 0 32c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32l0 160c0 17.7-14.3 32-32 32l0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32-192 0 0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32c-17.7 0-32-14.3-32-32l0-160c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32c0 0 0 0 0 0l0-32s0 0 0 0l0-16C64 35.2 153.6 0 288 0zM128 160l0 96c0 17.7 14.3 32 32 32l112 0 0-160-112 0c-17.7 0-32 14.3-32 32zM304 288l112 0c17.7 0 32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-112 0 0 160zM144 400a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm288 0a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM384 80c0-8.8-7.2-16-16-16L208 64c-8.8 0-16 7.2-16 16s7.2 16 16 16l160 0c8.8 0 16-7.2 16-16z"/></svg>
        </svg>
      </svg>
    `;
  }

  clearStopMarkers() {
    this.stopMarkers.forEach((marker) => {
      marker.remove();
    });
    this.stopMarkers.clear();
  }

  updateVehicleMarkers(vehicles: Dictionary<Vehicle>, _minZoomLevel: number) {
    if (!this.map) {
      this.toastrService.error('Map not initialized.');
      return;
    }

    Object.entries(vehicles).forEach(([busNumber, vehicle]) => {
      if (!vehicle) return;

      const position = new google.maps.LatLng(vehicle.latitude, vehicle.longitude);

      let marker = this.vehicleMarkers.get(busNumber);

      if (marker) {
        marker.position = position;
      } else {
        marker = new google.maps.marker.AdvancedMarkerElement({
          map: this.map,
          position: position,
          title: vehicle.headsign || 'Vehicle',
          content: this.createVehicleMarkerContent(vehicle),
        });

        marker.addListener('click', () => {
          // Handle vehicle click if needed.
        });

        this.vehicleMarkers.set(busNumber, marker);
      }
    });
  }

  // TODO vehicles are too big when zoomed out.
  // we need to get rid of the image, or make svg, or make image smaller on zoom out
  private createVehicleMarkerContent(_vehicle: Vehicle): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('custom-marker');
    div.innerHTML = `
      <img src="bus.png" alt="Vehicle Marker" class="custom-vehicle-marker" />
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
