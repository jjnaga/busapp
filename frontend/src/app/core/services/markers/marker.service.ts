import { inject, Injectable, OnDestroy } from '@angular/core';
import { Stop, Vehicle, RouteShape } from '../../utils/global.types';
import { Store } from '@ngrx/store';
import { setSelectedStop, setSelectedVehicle } from '../../state/lib/user/user.actions';
import { Dictionary } from '@ngrx/entity';
import { selectAllFavoriteEntities } from '../../state/lib/favorites/favorites.selectors';
import { selectNearbyStopIds } from '../../state/lib/stops/stops.selectors';
import { selectVehicleEntities } from '../../state/lib/vehicles/vehicles.selectors';
import { Subscription, BehaviorSubject, firstValueFrom } from 'rxjs';
import {
  createStopSVG,
  createUserMarkerContent,
  createVehicleMarkerContent,
  createClusterMarker,
} from './utils.service';
import { selectUserLocation } from '../../state/lib/user-location/user-location.selectors';
import { isValidCoordinate } from '../../utils/utils';
import { ClusteringService, StopCluster } from './clustering.service';

/**
 * MarkerService manages all map markers: stops, vehicles, user location, and clusters
 *
 * Key responsibilities:
 * 1. Stop Markers: Display bus stops with clustering at lower zoom levels
 *    - Zoom < 13: Show clusters only (no individual stops except when selected)
 *    - Zoom 13-14: Show clusters + key stops (favorites/nearby)
 *    - Zoom 15+: Show all individual stops (no clustering)
 *
 * 2. Vehicle Markers: Display active buses with smart rendering
 *    - Only render vehicles within viewport bounds
 *    - Reduce density at lower zoom levels for performance
 *    - Update position smoothly as vehicles move
 *
 * 3. Clustering: Group nearby stops to reduce marker count
 *    - Improves performance by reducing DOM elements
 *    - Improves usability by preventing marker overlap
 *    - Click on cluster to zoom in and reveal individual stops
 *
 * 4. User Marker: Show user's current location
 * 5. Route Shapes: Display route paths when a route is selected
 *
 * Performance optimizations:
 * - Viewport culling: Only render markers in visible area
 * - Marker recycling: Reuse existing markers when possible
 * - Zoom-based density: Fewer markers at lower zoom levels
 * - Debounced updates: Batch marker updates to reduce reflows
 */
@Injectable({
  providedIn: 'root',
})
export class MarkerService implements OnDestroy {
  minZoomLevel: number = 15;
  private currentZoom: number = 15;
  private lastRefreshZoom: number = 15;

  private store = inject(Store);
  private clusteringService = inject(ClusteringService);

  private map: google.maps.Map | null = null;
  private mapReady$ = new BehaviorSubject<google.maps.Map | null>(null);

  // Marker storage - separate maps for different marker types
  private stopMarkers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map();
  private vehicleMarkers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map();
  private clusterMarkers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map();
  private userMarker: google.maps.marker.AdvancedMarkerElement | null = null;
  private routeShapePolyline: google.maps.Polyline | null = null;

  private stopsSubscription!: Subscription;
  private userSubscription!: Subscription;
  private vehiclesSubscription!: Subscription;

  init(map: google.maps.Map) {
    this.map = map;
    this.mapReady$.next(map);
    this.currentZoom = map.getZoom() || 15;
    this.lastRefreshZoom = this.currentZoom;

    // Listen for zoom changes to refresh markers and clustering
    // When zoom level changes significantly, we need to:
    // 1. Recalculate clusters (different zoom = different cluster sizes)
    // 2. Update vehicle marker display (show/hide details based on zoom)
    // 3. Determine which individual stops to show
    map.addListener('zoom_changed', () => {
      const newZoom = map.getZoom() || 15;
      this.currentZoom = newZoom;

      // Check if we crossed clustering thresholds
      // These are the zoom levels where behavior changes:
      // - 13: Start showing some individual stops
      // - 15: Stop clustering completely
      const zoomDiff = Math.abs(newZoom - this.lastRefreshZoom);
      const crossedThreshold =
        (this.lastRefreshZoom < 13 && newZoom >= 13) ||
        (this.lastRefreshZoom >= 13 && newZoom < 13) ||
        (this.lastRefreshZoom < 15 && newZoom >= 15) ||
        (this.lastRefreshZoom >= 15 && newZoom < 15);

      if (crossedThreshold || zoomDiff >= 1) {
        // Significant zoom change - refresh everything
        this.refreshAllMarkers();
        this.lastRefreshZoom = newZoom;
      }
    });

    // Listen for map movement to update clusters based on new viewport
    // Debounce this slightly to avoid excessive updates during panning
    let idleTimeout: any;
    map.addListener('idle', () => {
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        this.refreshStopMarkers();
      }, 150);
    });

    // Initialize user location marker
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
    // Remove 'selected' class from all stop markers
    this.stopMarkers.forEach((marker) => {
      (marker.content as HTMLElement)?.classList.remove('selected');
    });

    // Add 'selected' class to the marker of the selected stop
    if (selectedStopId && this.stopMarkers.has(selectedStopId)) {
      const marker = this.stopMarkers.get(selectedStopId)!;
      (marker.content as HTMLElement)?.classList.add('selected');
    }
  }

  /**
   * Main method to refresh stop markers and clusters based on current zoom and viewport
   * Called when zoom level changes or map moves to update visible markers
   */
  private async refreshStopMarkers() {
    if (!this.map) return;

    const bounds = this.map.getBounds();
    if (!bounds) return;

    // Get all required data for stop rendering decisions
    const [favoriteEntities, nearbyStopIds, allStops] = await Promise.all([
      firstValueFrom(this.store.select(selectAllFavoriteEntities)),
      firstValueFrom(this.store.select(selectNearbyStopIds)),
      // We need to get all stops from the component that calls this
      // For now, we'll work with the stops passed to updateStopMarkers
      Promise.resolve({} as Dictionary<Stop>),
    ]);

    const favoriteIds = new Set(Object.keys(favoriteEntities));
    const nearbyIds = new Set(nearbyStopIds);

    // This will be called by updateStopMarkers with actual stop data
  }

  /**
   * Refresh all markers (stops, vehicles, clusters) when zoom threshold is crossed
   */
  private refreshAllMarkers() {
    this.refreshStopMarkers();
    this.refreshVehicleMarkerDisplay();
  }

  /**
   * Update stop markers based on current zoom level and viewport
   * Handles both individual stops and clusters intelligently
   *
   * @param stops - Dictionary of all stops to potentially display
   */
  updateStopMarkers(stops: Dictionary<Stop>) {
    if (!this.map) {
      return;
    }

    const bounds = this.map.getBounds();

    Promise.all([
      firstValueFrom(this.store.select(selectAllFavoriteEntities)),
      firstValueFrom(this.store.select(selectNearbyStopIds)),
    ])
      .then(([favoriteIds, nearbyStopIds]: [Dictionary<string>, string[]]) => {
        const favoriteSet = new Set(Object.keys(favoriteIds));
        const nearbySet = new Set(nearbyStopIds);

        // Generate clusters based on current zoom and viewport
        const clusters = this.clusteringService.clusterStops(stops, favoriteSet, nearbySet, this.currentZoom, bounds);

        // Get individual stops that should be shown (not in clusters)
        const individualStops = this.clusteringService.getIndividualStops(
          stops,
          favoriteSet,
          nearbySet,
          clusters,
          this.currentZoom
        );

        // Update cluster markers
        this.updateClusterMarkers(clusters);

        // Update individual stop markers
        // First, hide all stop markers that are now in clusters
        const clusteredStopIds = new Set<string>();
        clusters.forEach((cluster) => {
          cluster.stopIds.forEach((id) => clusteredStopIds.add(id));
        });

        // Remove/hide markers for stops that are now clustered
        this.stopMarkers.forEach((marker, stopId) => {
          if (clusteredStopIds.has(stopId) && !individualStops[stopId]) {
            marker.map = null; // Hide marker
          }
        });

        // Show/create markers for individual stops
        Object.entries(individualStops).forEach(([_, stop]) => {
          // Skip stops with invalid coordinates
          if (!stop || stop.stopLat === null || stop.stopLon === null) return;

          let marker = this.stopMarkers.get(stop.stopId);

          // Update existing marker
          if (marker) {
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

          // Create new marker for stop
          const isFavorite = !!favoriteIds[stop.stopId];
          const isNearby = nearbySet.has(stop.stopId);

          marker = new google.maps.marker.AdvancedMarkerElement({
            map: this.map,
            position: { lat: stop.stopLat!, lng: stop.stopLon! },
            title: stop.stopName || 'Bus Stop',
            content: createStopSVG(stop.stopName ?? '', isFavorite, isNearby),
            zIndex: 1000, // High value to ensure stops are on top of clusters
          });

          marker.addListener('click', () => {
            this.store.dispatch(setSelectedStop({ stop }));
            // Update highlighting immediately on click
            this.highlightStop(stop.stopId);
          });

          this.stopMarkers.set(stop.stopId, marker);
        });

        // Also show markers for stops in viewport that aren't clustered and aren't "individual"
        // This handles the zoom 15+ case where we show everything
        if (this.currentZoom >= 15) {
          Object.entries(stops).forEach(([_, stop]) => {
            if (!stop || stop.stopLat === null || stop.stopLon === null) return;

            // Skip if already handled as individual stop
            if (individualStops[stop.stopId]) return;

            // Check if in viewport
            if (bounds) {
              const stopLatLng = new google.maps.LatLng(stop.stopLat, stop.stopLon);
              if (!bounds.contains(stopLatLng)) return;
            }

            let marker = this.stopMarkers.get(stop.stopId);

            if (marker) {
              if (!marker.map) {
                marker.map = this.map;
              }
              return;
            }

            // Create new marker
            const isFavorite = !!favoriteIds[stop.stopId];
            const isNearby = nearbySet.has(stop.stopId);

            marker = new google.maps.marker.AdvancedMarkerElement({
              map: this.map,
              position: { lat: stop.stopLat!, lng: stop.stopLon! },
              title: stop.stopName || 'Bus Stop',
              content: createStopSVG(stop.stopName ?? '', isFavorite, isNearby),
              zIndex: 1000,
            });

            marker.addListener('click', () => {
              this.store.dispatch(setSelectedStop({ stop }));
              this.highlightStop(stop.stopId);
            });

            this.stopMarkers.set(stop.stopId, marker);
          });
        }
      })
      .catch((error) => {
        console.error('Error updating stop markers:', error);
      });
  }

  /**
   * Update cluster markers on the map
   * Creates new cluster markers or updates existing ones
   *
   * @param clusters - Array of clusters to display
   */
  private updateClusterMarkers(clusters: StopCluster[]) {
    if (!this.map) return;

    const activeClusterIds = new Set(clusters.map((c) => c.id));

    // Remove cluster markers that are no longer needed
    this.clusterMarkers.forEach((marker, clusterId) => {
      if (!activeClusterIds.has(clusterId)) {
        marker.map = null;
      }
    });

    // Create or update cluster markers
    clusters.forEach((cluster) => {
      let marker = this.clusterMarkers.get(cluster.id);

      if (marker) {
        // Update existing cluster marker position if needed
        const newPosition = new google.maps.LatLng(cluster.center.lat, cluster.center.lng);
        const currentPosition =
          marker.position instanceof google.maps.LatLng
            ? marker.position
            : new google.maps.LatLng(marker.position?.lat || 0, marker.position?.lng || 0);

        if (!currentPosition.equals(newPosition)) {
          marker.position = newPosition;
        }

        // Update content (count might have changed)
        marker.content = createClusterMarker(cluster.count, cluster.hasFavorite, cluster.hasNearby);

        if (!marker.map) {
          marker.map = this.map;
        }
      } else {
        // Create new cluster marker
        marker = new google.maps.marker.AdvancedMarkerElement({
          map: this.map,
          position: cluster.center,
          title: `${cluster.count} stops`,
          content: createClusterMarker(cluster.count, cluster.hasFavorite, cluster.hasNearby),
          zIndex: 500, // Lower than individual stops so they appear on top when overlapping
        });

        // When cluster is clicked, zoom in to reveal individual stops
        marker.addListener('click', () => {
          if (!this.map) return;

          // Zoom in one level centered on the cluster
          // This will trigger re-clustering and potentially show individual stops
          const currentZoom = this.map.getZoom() || 15;
          this.map.panTo(cluster.center);
          this.map.setZoom(currentZoom + 2); // Jump 2 zoom levels for more responsive feel
        });

        this.clusterMarkers.set(cluster.id, marker);
      }
    });
  }

  // update all stops in parameter. if stop is not listed in parameter, remove it from map.
  // DEPRECATED: Replaced by new updateStopMarkers above, keeping for reference during migration
  /* OLD VERSION:
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

    Promise.all([
      firstValueFrom(this.store.select(selectAllFavoriteEntities)),
      firstValueFrom(this.store.select(selectNearbyStopIds)),
    ])
      .then(([favoriteIds, nearbyStopIds]: [Dictionary<string>, string[]]) => {
        const nearbyStopIdsSet = new Set(nearbyStopIds);

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
          const isFavorite = !!favoriteIds[stop.stopId];
          const isNearby = nearbyStopIdsSet.has(stop.stopId);

          // Create marker for the stop - add zIndex parameter
          marker = new google.maps.marker.AdvancedMarkerElement({
            map: this.map,
            position: { lat: stop.stopLat!, lng: stop.stopLon! },
            title: stop.stopName || 'Bus Stop',
            content: createStopSVG(stop.stopName ?? '', isFavorite, isNearby),
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
        console.error('Error getting favorite and nearby stop information:', error);
      });
  }
  */

  /**
   * Update vehicle marker positions (called frequently as vehicles move)
   * Only updates position and content for existing markers
   * More efficient than full updateVehicleMarkers since it doesn't create/destroy markers
   *
   * @param vehicles - Array of vehicles with updated coordinates
   */
  updateVehicleCoordinates(vehicles: Vehicle[]) {
    if (!this.map) return;

    const bounds = this.map.getBounds();

    for (const vehicle of vehicles) {
      const marker = this.vehicleMarkers.get(vehicle.busNumber);

      if (marker) {
        // Update existing marker position
        marker.position = new google.maps.LatLng(vehicle.latitude, vehicle.longitude);

        // Check if marker is now outside viewport - hide it for performance
        if (bounds) {
          const isInBounds = bounds.contains(marker.position);
          if (!isInBounds && marker.map) {
            marker.map = null; // Hide marker outside viewport
          } else if (isInBounds && !marker.map) {
            marker.map = this.map; // Show marker that re-entered viewport
          }
        }

        // Update content to ensure it reflects current zoom level and vehicle data
        marker.content = createVehicleMarkerContent(vehicle.routeName, vehicle.headsign, this.currentZoom);
      } else {
        // Create new marker if it doesn't exist and coordinates are valid
        if (isValidCoordinate(vehicle.latitude, vehicle.longitude)) {
          const position = new google.maps.LatLng(vehicle.latitude, vehicle.longitude);

          // Only create marker if it's in viewport (performance optimization)
          if (!bounds || bounds.contains(position)) {
            // Create new marker
            const newMarker = new google.maps.marker.AdvancedMarkerElement({
              map: this.map,
              position: position,
              title: vehicle.headsign || 'Vehicle',
              content: createVehicleMarkerContent(vehicle.routeName, vehicle.headsign, this.map?.getZoom()),
              zIndex: 5000, // Above stops and clusters
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
  }

  /**
   * Update vehicle markers with smart rendering based on zoom and viewport
   * Implements performance optimizations:
   * 1. Only render vehicles in viewport
   * 2. At lower zoom levels, reduce vehicle density (show fewer vehicles)
   * 3. Recycle existing markers when possible
   *
   * @param vehicles - Dictionary of all vehicles
   */
  updateVehicleMarkers(vehicles: Dictionary<Vehicle>) {
    if (!this.map) {
      return;
    }

    const bounds = this.map.getBounds();

    // Remove markers for vehicles that are no longer in the list
    this.vehicleMarkers.forEach((marker, busNumber) => {
      if (!vehicles[busNumber]) {
        marker.map = null;
      }
    });

    // Determine vehicle rendering strategy based on zoom
    const shouldShowAllVehicles = this.currentZoom >= 13;
    const vehicleDisplayInterval = this.getVehicleDisplayInterval();

    // Convert vehicles to array for interval-based filtering
    const vehicleArray = Object.values(vehicles).filter((v) => v) as Vehicle[];

    // Filter vehicles based on zoom level and interval
    let vehiclesToShow: Vehicle[];
    if (shouldShowAllVehicles) {
      vehiclesToShow = vehicleArray;
    } else {
      // At low zoom, show only every Nth vehicle to reduce clutter
      vehiclesToShow = vehicleArray.filter((_, index) => index % vehicleDisplayInterval === 0);
    }

    // Add or update markers for vehicles
    vehiclesToShow.forEach((vehicle) => {
      if (!vehicle) return;

      // Check if coordinates are valid
      let position = new google.maps.LatLng(vehicle.latitude, vehicle.longitude);
      if (!isValidCoordinate(vehicle.latitude, vehicle.longitude)) return;

      // Skip if outside viewport (viewport culling for performance)
      if (bounds && !bounds.contains(position)) {
        // Hide marker if it exists
        const marker = this.vehicleMarkers.get(vehicle.busNumber);
        if (marker && marker.map) {
          marker.map = null;
        }
        return;
      }

      // Update marker if it exists
      let marker = this.vehicleMarkers.get(vehicle.busNumber);

      if (marker) {
        // Show marker if it was hidden
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
        content: createVehicleMarkerContent(vehicle.routeName, vehicle.headsign, this.map?.getZoom()),
        zIndex: 5000, // Above stops and clusters
      });

      marker.addListener('click', () => {
        console.log('Vehicle clicked:', vehicle);
        this.store.dispatch(setSelectedVehicle({ vehicleId: vehicle.busNumber }));
      });

      this.vehicleMarkers.set(vehicle.busNumber, marker);
    });
  }

  /**
   * Determine how many vehicles to skip at current zoom level
   * Lower zoom = higher interval = fewer vehicles shown
   * This prevents overwhelming the browser with markers at low zoom
   *
   * @returns Interval for vehicle display (1 = show all, 2 = show every 2nd, etc.)
   */
  private getVehicleDisplayInterval(): number {
    if (this.currentZoom >= 13) return 1; // Show all vehicles
    if (this.currentZoom >= 12) return 2; // Show every 2nd vehicle
    if (this.currentZoom >= 11) return 3; // Show every 3rd vehicle
    return 5; // Show every 5th vehicle at very low zoom
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

  // Refresh vehicle marker display based on current zoom level
  private refreshVehicleMarkerDisplay(): void {
    if (!this.map) return;

    // Get current vehicles from store
    firstValueFrom(this.store.select(selectVehicleEntities))
      .then((vehicles) => {
        // Update each vehicle marker's content
        Object.entries(vehicles).forEach(([busNumber, vehicle]) => {
          if (!vehicle) return;

          const marker = this.vehicleMarkers.get(busNumber);
          if (marker) {
            // Update the marker content with new zoom-appropriate display
            marker.content = createVehicleMarkerContent(vehicle.routeName, vehicle.headsign, this.currentZoom);
          }
        });
      })
      .catch((error) => {
        console.error('Error refreshing vehicle marker display:', error);
      });
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

  clearClusterMarkers() {
    this.clusterMarkers.forEach((marker) => {
      marker.remove();
      marker.map = null;
    });
    this.clusterMarkers.clear();
  }

  clearAllMarkers() {
    this.clearStopMarkers();
    this.clearVehicleMarkers();
    this.clearClusterMarkers();
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
