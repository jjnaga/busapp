import { Component, OnDestroy } from '@angular/core';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastrService } from 'ngx-toastr';
import { Store } from '@ngrx/store';
import { selectAllStops } from '../../../core/state/lib/stops/stops.selectors';
import { Observable, Subscription } from 'rxjs';
import { Stop } from '../../../core/utils/global.types';
import { setSelectedStop } from '../../../core/state/lib/user/user.actions';

@Component({
  selector: 'map-component',
  templateUrl: './map.component.html',
  standalone: true,
  imports: [GoogleMap, GoogleMapsModule, CommonModule, FontAwesomeModule],
})
export class MapComponent implements OnDestroy {
  map: google.maps.Map | null = null;
  mapOptions: google.maps.MapOptions = {
    mapId: '53da1ad002655c53',
    center: { lat: 21.3069, lng: -157.8583 },
    zoom: 12,
  };

  stops$: Observable<Stop[]>;
  allStops: Stop[] = [];
  // Use a map keyed by stopId for efficient marker management.
  stopMarkersMap: Map<string, google.maps.marker.AdvancedMarkerElement> =
    new Map();
  stopsSubscription!: Subscription;
  minZoomLevel: number = 15;
  mapIdleListener: google.maps.MapsEventListener | null = null;

  constructor(private toastrService: ToastrService, private store: Store) {
    this.stops$ = this.store.select(selectAllStops);
  }

  ngOnDestroy() {
    if (this.stopsSubscription) {
      this.stopsSubscription.unsubscribe();
    }
    if (this.mapIdleListener) {
      this.mapIdleListener.remove();
    }
    // Also clear any remaining markers
    this.clearAllMarkers();
  }

  onMapReady(map: google.maps.Map) {
    this.map = map;
    this.map.setOptions(this.mapOptions);

    // Now that Google Maps is ready, subscribe to stops.
    this.stopsSubscription = this.stops$.subscribe((stops) => {
      this.allStops = stops;
      this.updateMarkers();
    });

    // Listen for map changes (pan/zoom) and update markers accordingly.
    this.mapIdleListener = this.map.addListener('idle', () => {
      console.log('maybe this is why');
      this.updateMarkers();
    });

    this.map.addListener('zoom_changed', () => {
      this.updateMarkers();
    });
  }

  updateMarkers() {
    if (!this.map || !google.maps.marker) {
      this.toastrService.error('Google Maps Marker library not loaded.');
      return;
    }

    const currentZoom = this.map.getZoom();
    if (currentZoom === undefined) {
      return;
    }

    // If zoomed out too far, clear markers and exit
    if (currentZoom < this.minZoomLevel) {
      console.log('WORK');
      this.clearAllMarkers();
      return;
    }

    const bounds = this.map.getBounds();
    if (!bounds) {
      return;
    }

    // Remove markers that are outside the current viewport
    for (const [stopId, marker] of this.stopMarkersMap.entries()) {
      // Here, we re-create the LatLng for each marker’s stop
      // (Assuming you stored the stop info somewhere, or use marker.getPosition())
      const markerPos = marker.position;
      if (!markerPos || !bounds.contains(markerPos)) {
        console.log('we never hit?');
        marker.remove();
        this.stopMarkersMap.delete(stopId);
      }
    }

    // Filter stops that are inside the current viewport
    const visibleStops = this.allStops.filter((stop) => {
      if (stop.stopLat === null || stop.stopLon === null) return false;
      const position = new google.maps.LatLng(stop.stopLat, stop.stopLon);
      return bounds.contains(position);
    });

    // Add markers for stops that are visible and not already added
    visibleStops.forEach((stop) => {
      if (
        !this.stopMarkersMap.has(stop.stopId) &&
        stop.stopLat &&
        stop.stopLon
      ) {
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: this.map,
          position: { lat: stop.stopLat, lng: stop.stopLon },
          title: stop.stopName || 'Bus Stop',
          content: this.createCustomMarker(stop),
        });

        marker.addListener('click', () => {
          this.store.dispatch(setSelectedStop({ stop }));
          console.log('Marker clicked:', stop);
        });

        console.log(stop, stop.stopId);
        this.stopMarkersMap.set(stop.stopId, marker);
      }
    });
  }

  // Remove all markers from the map and clear our marker map.
  clearAllMarkers() {
    for (const marker of this.stopMarkersMap.values()) {
      console.log(marker);
      marker.remove();
      marker.map = null;
      console.log(marker);
    }
    this.stopMarkersMap.clear();
  }

  createCustomMarker(stop: Stop): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('custom-marker');
    div.innerHTML = `
      <div class="marker-container ${true ? 'favorite' : ''}">
        <img src="${
          false ? 'star-marker.svg' : 'bus-stop-marker.svg'
        }" class="marker-icon" />
      </div>
    `;
    return div;
  }
}
