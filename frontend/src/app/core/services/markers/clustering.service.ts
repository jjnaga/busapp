import { Injectable } from '@angular/core';
import { Stop } from '../../utils/global.types';
import { Dictionary } from '@ngrx/entity';

/**
 * StopCluster represents a group of stops that are close together geographically
 * Used to reduce marker clutter at lower zoom levels
 */
export interface StopCluster {
  // Unique identifier for this cluster
  id: string;
  // Geographic center point of the cluster
  center: { lat: number; lng: number };
  // Array of stop IDs that belong to this cluster
  stopIds: string[];
  // Number of stops in this cluster
  count: number;
  // Whether this cluster contains any favorite stops
  hasFavorite: boolean;
  // Whether this cluster contains any nearby stops
  hasNearby: boolean;
}

/**
 * ClusteringService handles grouping of bus stops into clusters based on geographic proximity
 *
 * Purpose: At lower zoom levels, showing all individual stops causes:
 * 1. Performance issues - too many markers to render smoothly
 * 2. Usability issues - stops clump together making them hard to click
 *
 * Solution: Group nearby stops into clusters that:
 * - Show a single cluster marker representing multiple stops
 * - Display the count of stops in the cluster
 * - Expand to individual stops when zoomed in closer
 *
 * Zoom behavior:
 * - Zoom < 13: Show only clusters
 * - Zoom 13-14: Show clusters + individual key stops (favorites/nearby)
 * - Zoom 15+: Show all individual stops (no clustering)
 *
 * Algorithm: Grid-based clustering for consistent, predictable grouping
 * - Divides map into grid cells based on zoom level
 * - Groups stops that fall within the same grid cell
 * - Adjustable grid size based on zoom (larger cells = bigger clusters)
 */
@Injectable({
  providedIn: 'root',
})
export class ClusteringService {
  /**
   * Main clustering function that groups stops based on current zoom level
   *
   * @param stops - Dictionary of all stops to potentially cluster
   * @param favoriteIds - Set of stop IDs that are marked as favorites
   * @param nearbyIds - Set of stop IDs that are nearby the user
   * @param zoom - Current map zoom level
   * @param bounds - Current map viewport bounds (only cluster visible stops)
   * @returns Array of clusters to display on the map
   */
  clusterStops(
    stops: Dictionary<Stop>,
    favoriteIds: Set<string>,
    nearbyIds: Set<string>,
    zoom: number,
    bounds?: google.maps.LatLngBounds
  ): StopCluster[] {
    // At high zoom (15+), don't cluster - show all stops individually
    if (zoom >= 15) {
      return [];
    }

    // Filter stops to only those in viewport (performance optimization)
    const visibleStops = this.getVisibleStops(stops, bounds);

    // Determine grid cell size based on zoom level
    // Lower zoom = larger cells = bigger clusters
    const gridSize = this.getGridSizeForZoom(zoom);

    // Group stops into grid cells
    const gridMap = new Map<string, Stop[]>();

    Object.values(visibleStops).forEach((stop) => {
      if (!stop || stop.stopLat === null || stop.stopLon === null) return;

      // Calculate which grid cell this stop belongs to
      const gridKey = this.getGridKey(stop.stopLat, stop.stopLon, gridSize);

      // Add stop to its grid cell
      if (!gridMap.has(gridKey)) {
        gridMap.set(gridKey, []);
      }
      gridMap.get(gridKey)!.push(stop);
    });

    // Convert grid cells into cluster objects
    const clusters: StopCluster[] = [];

    gridMap.forEach((stopsInCell, gridKey) => {
      // For zoom 13-14, don't cluster cells with only favorites or nearby stops
      // Let them show as individual markers for better UX
      if (zoom >= 13 && zoom < 15) {
        const allAreFavoritesOrNearby = stopsInCell.every(
          (stop) => favoriteIds.has(stop.stopId) || nearbyIds.has(stop.stopId)
        );

        // If all stops in this cell are favorites/nearby and there's only a few, skip clustering
        if (allAreFavoritesOrNearby && stopsInCell.length <= 3) {
          return;
        }
      }

      // Only create cluster if there are 2+ stops
      // Single stops will be rendered individually
      if (stopsInCell.length < 2) {
        return;
      }

      // Calculate cluster center (average of all stop positions)
      const center = this.calculateCenter(stopsInCell);

      // Check if cluster contains any favorites or nearby stops
      const hasFavorite = stopsInCell.some((stop) => favoriteIds.has(stop.stopId));
      const hasNearby = stopsInCell.some((stop) => nearbyIds.has(stop.stopId));

      clusters.push({
        id: `cluster-${gridKey}`,
        center,
        stopIds: stopsInCell.map((s) => s.stopId),
        count: stopsInCell.length,
        hasFavorite,
        hasNearby,
      });
    });

    return clusters;
  }

  /**
   * Filter stops to only those within the viewport bounds
   * Reduces processing time and memory usage by ignoring off-screen stops
   */
  private getVisibleStops(stops: Dictionary<Stop>, bounds?: google.maps.LatLngBounds): Dictionary<Stop> {
    if (!bounds) return stops;

    const visibleStops: Dictionary<Stop> = {};

    Object.entries(stops).forEach(([id, stop]) => {
      if (!stop || stop.stopLat === null || stop.stopLon === null) return;

      const stopLatLng = new google.maps.LatLng(stop.stopLat, stop.stopLon);
      if (bounds.contains(stopLatLng)) {
        visibleStops[id] = stop;
      }
    });

    return visibleStops;
  }

  /**
   * Determine grid cell size based on zoom level
   * Lower zoom = larger cells = more aggressive clustering
   *
   * Grid size represents approximate distance in degrees
   * - Zoom 10: ~0.5 degrees (~55km at equator)
   * - Zoom 11: ~0.25 degrees (~27km)
   * - Zoom 12: ~0.1 degrees (~11km)
   * - Zoom 13: ~0.05 degrees (~5.5km)
   * - Zoom 14: ~0.02 degrees (~2.2km)
   */
  private getGridSizeForZoom(zoom: number): number {
    if (zoom < 11) return 0.5;
    if (zoom < 12) return 0.25;
    if (zoom < 13) return 0.1;
    if (zoom < 14) return 0.05;
    return 0.02; // zoom 14
  }

  /**
   * Generate a grid key for a lat/lng coordinate
   * Rounds coordinates to grid cell boundaries
   *
   * Example: lat=21.3069, lng=-157.8583, gridSize=0.1
   * Returns: "21.3,-157.9" (rounded to nearest 0.1)
   */
  private getGridKey(lat: number, lng: number, gridSize: number): string {
    const latKey = Math.floor(lat / gridSize) * gridSize;
    const lngKey = Math.floor(lng / gridSize) * gridSize;
    return `${latKey.toFixed(4)},${lngKey.toFixed(4)}`;
  }

  /**
   * Calculate the geographic center point of a group of stops
   * Uses simple average of all stop coordinates
   */
  private calculateCenter(stops: Stop[]): { lat: number; lng: number } {
    let totalLat = 0;
    let totalLng = 0;
    let count = 0;

    stops.forEach((stop) => {
      if (stop.stopLat !== null && stop.stopLon !== null) {
        totalLat += stop.stopLat;
        totalLng += stop.stopLon;
        count++;
      }
    });

    return {
      lat: totalLat / count,
      lng: totalLng / count,
    };
  }

  /**
   * Get individual stops that should be shown outside of clusters
   * Used for zoom 13-14 to show important stops even when clustering is active
   *
   * @param stops - All stops
   * @param favoriteIds - Favorite stop IDs
   * @param nearbyIds - Nearby stop IDs
   * @param clusters - Active clusters
   * @param zoom - Current zoom level
   * @returns Stops that should be shown individually
   */
  getIndividualStops(
    stops: Dictionary<Stop>,
    favoriteIds: Set<string>,
    nearbyIds: Set<string>,
    clusters: StopCluster[],
    zoom: number
  ): Dictionary<Stop> {
    // At zoom 15+, show all stops (no clustering)
    if (zoom >= 15) {
      return stops;
    }

    // At zoom < 13, show no individual stops (clusters only)
    if (zoom < 13) {
      return {};
    }

    // At zoom 13-14, show favorites and nearby stops that aren't in large clusters
    const clusteredStopIds = new Set<string>();
    clusters.forEach((cluster) => {
      cluster.stopIds.forEach((id) => clusteredStopIds.add(id));
    });

    const individualStops: Dictionary<Stop> = {};

    Object.entries(stops).forEach(([id, stop]) => {
      if (!stop) return;

      // Skip if this stop is in a cluster
      if (clusteredStopIds.has(id)) {
        return;
      }

      // Show favorites and nearby stops
      if (favoriteIds.has(id) || nearbyIds.has(id)) {
        individualStops[id] = stop;
      }
    });

    return individualStops;
  }
}
