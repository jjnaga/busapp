import { inject, Injectable, OnDestroy } from '@angular/core';
import { Stop, Vehicle, RouteShape } from '../../utils/global.types';
import { Store } from '@ngrx/store';
import { setSelectedStop, setSelectedVehicle } from '../../state/lib/user/user.actions';
import { Dictionary } from '@ngrx/entity';
import { selectAllFavoriteEntities } from '../../state/lib/favorites/favorites.selectors';
import { Subscription, BehaviorSubject, firstValueFrom } from 'rxjs';
import { createStopSVG, createUserMarkerContent, createVehicleMarkerContent } from './utils.service';
import { selectUserLocation } from '../../state/lib/user-location/user-location.selectors';
import { isValidCoordinate } from '../../utils/utils';

@Injectable({
  providedIn: 'root',
})
export class MarkerService implements OnDestroy {
  minZoomLevel: number = 15;

  private store = inject(Store);
  private map: google.maps.Map | null = null;
  private mapReady$ = new BehaviorSubject<google.maps.Map | null>(null);

  private stopMarkers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map();
  private vehicleMarkers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map();
  private userMarker: google.maps.marker.AdvancedMarkerElement | null = null;
  private routeShapePolyline: google.maps.Polyline | null = null;

  private stopsSubscription!: Subscription;
  private userSubscription!: Subscription;
  private vehiclesSubscription!: Subscription;

  init(map: google.maps.Map) {
    this.map = map;
    this.mapReady$.next(map);

    this.userSubscription = this.store.select(selectUserLocation).subscribe((location) => {
      if (location && location.latitude && location.longitude) {
        const latLng = new google.maps.LatLng(location.latitude, location.longitude);
        this.updateUserMarker(new google.maps.LatLng(latLng), true);
      }
    });
  }

  getUserMarker() {
    return this.userMarker;
  }

  private highlightStop(selectedStopId: string | null): void {
    // Remove 'selected' class from all markers.
    this.stopMarkers.forEach((marker) => {
      (marker.content as HTMLElement)?.classList.remove('selected');
    });

    // Add 'selected' class to the marker of the selected stop.
    if (selectedStopId && this.stopMarkers.has(selectedStopId)) {
      const marker = this.stopMarkers.get(selectedStopId)!;
      (marker.content as HTMLElement)?.classList.add('selected');
    }
  }

  // update all stops in parameter. if stop is not listed in parameter, remove it from map.
  updateStopMarkers(stops: Dictionary<Stop>) {
    if (!this.map) {
      return;
    }

    // Remove markers for stops that are now outside the viewport.
    this.stopMarkers.forEach((stopMarker, stopId) => {
      if (!stops[stopId] || !stopMarker.position) {
        // stopMarker.remove();
        stopMarker.map = null;
      }
    });

    firstValueFrom(this.store.select(selectAllFavoriteEntities))
      .then((favoriteIds: Dictionary<string>) => {
        // Add or update markers for stops inside the viewport.
        Object.entries(stops).forEach(([_, stop]) => {
          // Skip stops with invalid coordinates.
          if (!stop || stop.stopLat === null || stop.stopLon === null) return;

          let marker = this.stopMarkers.get(stop.stopId);

          // return early - Update marker if it already exists.
          if (marker) {
            // Update marker position if it has moved.
            const position = new google.maps.LatLng(stop.stopLat, stop.stopLon);

            const currentPosition =
              marker.position instanceof google.maps.LatLng
                ? marker.position
                : new google.maps.LatLng(marker.position?.lat || 0, marker.position?.lng || 0);

            if (!marker.position || !currentPosition.equals(position)) {
              marker.position = position;
            }

            if (!marker.map) {
              marker.map = this.map;
            }

            return;
          }

          // Create marker for the stop.
          const isFavorite = favoriteIds[stop.stopId];

          // Create marker for the stop - add zIndex parameter
          marker = new google.maps.marker.AdvancedMarkerElement({
            map: this.map,
            position: { lat: stop.stopLat!, lng: stop.stopLon! },
            title: stop.stopName || 'Bus Stop',
            content: createStopSVG(stop.stopName ?? '', !!isFavorite),
            zIndex: 1000, // High value to ensure stops are on top
          });

          marker.addListener('click', () => {
            this.store.dispatch(setSelectedStop({ stop }));
            // Update highlighting immediately on click.
            this.highlightStop(stop.stopId);
          });

          this.stopMarkers.set(stop.stopId, marker);
        });
      })
      .catch((error) => {
        console.error('Error getting favorite stop IDs:', error);
      });
  }

  updateVehicleCoordinates(vehicles: Vehicle[]) {
    if (!this.map) return;

    for (const vehicle of vehicles) {
      const marker = this.vehicleMarkers.get(vehicle.busNumber);
      if (marker) {
        // Update existing marker
        marker.position = new google.maps.LatLng(vehicle.latitude, vehicle.longitude);
      } else {
        // Create new marker if it doesn't exist and coordinates are valid
        if (isValidCoordinate(vehicle.latitude, vehicle.longitude)) {
          const position = new google.maps.LatLng(vehicle.latitude, vehicle.longitude);

          // Create new marker
          const newMarker = new google.maps.marker.AdvancedMarkerElement({
            map: this.map,
            position: position,
            title: vehicle.headsign || 'Vehicle',
            content: createVehicleMarkerContent(),
            zIndex: 5000,
          });

          // Update click listener to select vehicle
          newMarker.addListener('click', () => {
            console.log('Vehicle clicked:', vehicle);
            this.store.dispatch(setSelectedVehicle({ vehicleId: vehicle.busNumber }));
          });

          this.vehicleMarkers.set(vehicle.busNumber, newMarker);
        }
      }
    }
  }

  // update all vehicles in paramater. if vehicle is not listed in paramater, remove it from map.
  updateVehicleMarkers(vehicles: Dictionary<Vehicle>) {
    if (!this.map) {
      // this.toastrService.error('Map not initialized.');
      return;
    }

    // Remove markers for vehicles that are not in the list.
    this.vehicleMarkers.forEach((marker, busNumber) => {
      if (!vehicles[busNumber]) {
        // marker.remove();
        marker.map = null;
      }
    });

    // Add or update markers for vehicles in the list.
    Object.entries(vehicles).forEach(([busNumber, vehicle]) => {
      if (!vehicle) return;

      // check if coordinates are valid
      let position = new google.maps.LatLng(vehicle.latitude, vehicle.longitude);
      if (!isValidCoordinate(vehicle.latitude, vehicle.longitude)) return;

      // update marker and return if it exists.
      let marker = this.vehicleMarkers.get(busNumber);

      if (marker) {
        if (marker.map === null) {
          marker.map = this.map;
        }

        return;
      }

      // Create new marker
      marker = new google.maps.marker.AdvancedMarkerElement({
        map: this.map,
        position: position,
        title: vehicle.headsign || 'Vehicle',
        content: createVehicleMarkerContent(),
        zIndex: 5000,
      });

      marker.addListener('click', () => {
        console.log('Vehicle clicked:', vehicle);
        this.store.dispatch(setSelectedVehicle({ vehicleId: vehicle.busNumber }));
      });

      this.vehicleMarkers.set(busNumber, marker);
    });
  }

  updateUserMarker(coordinates: google.maps.LatLng, visibility?: boolean) {
    if (!this.map) {
      return;
    }

    // make marker if it does not exist.
    if (!this.userMarker) {
      this.userMarker = new google.maps.marker.AdvancedMarkerElement({
        map: this.map,
        title: 'Your Location',
        content: createUserMarkerContent(),
        zIndex: 10000,
      });
    }

    // add marker to the map if it is not already there.
    if (this.userMarker.map === null && visibility === true) this.userMarker.map = this.map;

    // set coordinates
    this.userMarker.position = coordinates;
  }

  // New method to display route shape
  displayRouteShape(routeShape: RouteShape): void {
    if (!this.map) return;

    // Clear existing polyline if any
    this.clearRouteShape();

    // Create new polyline with the route shape
    this.routeShapePolyline = new google.maps.Polyline({
      path: routeShape,
      geodesic: true,
      strokeColor: '#0088FF',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      zIndex: 2000, // Keep below vehicle markers but above other elements
    });

    // Add the polyline to the map
    this.routeShapePolyline.setMap(this.map);
  }

  // New method to clear route shape
  clearRouteShape(): void {
    if (this.routeShapePolyline) {
      this.routeShapePolyline.setMap(null);
      this.routeShapePolyline = null;
    }
  }

  clearVehicleMarkers() {
    this.vehicleMarkers.forEach((marker) => {
      marker.remove();
      marker.map = null;
    });
    this.vehicleMarkers.clear();
  }

  clearStopMarkers() {
    this.stopMarkers.forEach((marker) => {
      marker.remove();
      marker.map = null;
    });
    this.stopMarkers.clear();
  }

  clearAllMarkers() {
    this.clearStopMarkers();
    this.clearVehicleMarkers();
    this.clearRouteShape();

    if (this.userMarker) {
      this.userMarker.remove();
      this.userMarker = null;
    }
  }

  ngOnDestroy(): void {
    this.stopsSubscription?.unsubscribe();
    this.vehiclesSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.clearRouteShape();
  }
}
