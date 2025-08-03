import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StopsState } from './stops.reducers';
import { selectUserLocation } from '../user-location/user-location.selectors';
import { selectAllFavoriteIds } from '../favorites/favorites.selectors';
import { isValidLocation, isValidStop } from '../../../utils/type-guards';
import { selectUserState } from '../user/user.selectors';
import { UserState } from '../user/user.reducers';
import { Stop } from '../../../utils/global.types';

export const selectStopsState = createFeatureSelector<StopsState>('stops');

export const selectAllStops = createSelector(selectStopsState, (state: StopsState) => state.entities);

export const selectStopsLoading = createSelector(selectStopsState, (state: StopsState) => state.loading);

export const selectSelectedStop = createSelector(
  selectUserState,
  selectAllStops,
  (state: UserState, stops): Stop | undefined => {
    if (!state.selectedStop || !stops) {
      return undefined;
    }

    const selectedStop = stops[state.selectedStop];

    if (!selectedStop) {
      return undefined;
    } else {
      return selectedStop;
    }
  }
);

export const selectAllStopsSortedByDistance = createSelector(selectUserLocation, selectAllStops, (userLoc, stops) => {
  if (!isValidLocation(userLoc) || !stops) return [];

  return Object.values(stops)
    .filter(isValidStop)
    .map((stop) => ({
      ...stop,
      stopName: stop.stopName,
      distance: calcDistance(userLoc.latitude, userLoc.longitude, stop.stopLat, stop.stopLon),
    }))
    .sort((a, b) => a.distance - b.distance);
});

export const selectStopsTracking = createSelector(selectStopsState, (state: StopsState) => state.stopsTracking);
export const selectStopsTrackingValues = createSelector(selectStopsState, (state: StopsState) =>
  Object.keys(state.stopsTracking)
);

export const selectStopIsTracked = (stopId: string) =>
  createSelector(selectStopsTracking, (stopsTracking) => !!stopsTracking[stopId]);

// Selector for nearby stops that should be highlighted and tracked
export const selectNearbyStops = createSelector(
  selectAllFavoriteIds,
  selectAllStopsSortedByDistance,
  selectUserLocation,
  (favoriteIds, allStopsSortedByDistance, userLocation) => {
    if (!userLocation || !allStopsSortedByDistance.length) {
      return [];
    }

    const MAX_NEARBY_STOPS = 5;
    const NEARBY_THRESHOLD_METERS = 500;
    const favoriteIdSet = new Set(favoriteIds);

    // Find favorites within 500m
    const nearbyFavorites = allStopsSortedByDistance
      .filter((stop) => favoriteIdSet.has(stop.stopId) && stop.distance <= NEARBY_THRESHOLD_METERS)
      .map((stop) => ({ ...stop, isFavorite: true, isNearby: true }));

    // Find closest non-favorite stops to fill up to MAX_NEARBY_STOPS
    const closestNonFavoriteStops =
      nearbyFavorites.length < MAX_NEARBY_STOPS
        ? allStopsSortedByDistance
            .filter((stop) => !favoriteIdSet.has(stop.stopId))
            .slice(0, MAX_NEARBY_STOPS - nearbyFavorites.length)
            .map((stop) => ({ ...stop, isFavorite: false, isNearby: true }))
        : [];

    return [...nearbyFavorites, ...closestNonFavoriteStops];
  }
);

// Selector for nearby stop IDs that should be tracked
export const selectNearbyStopIds = createSelector(selectNearbyStops, (nearbyStops) =>
  nearbyStops.map((stop) => stop.stopId)
);

// Selector for nearby non-favorite stop IDs (the ones we manage in effects)
export const selectNearbyNonFavoriteStopIds = createSelector(
  selectNearbyStops,
  selectAllFavoriteIds,
  (nearbyStops, favoriteIds) => {
    // Safety checks to prevent undefined errors
    if (!nearbyStops || !favoriteIds) {
      return [];
    }

    // Convert favoriteIds array to Set for efficient lookup
    const favoriteIdSet = new Set(favoriteIds);
    return nearbyStops.filter((stop) => !favoriteIdSet.has(stop.stopId)).map((stop) => stop.stopId);
  }
);

// Selector to check if a stop is nearby (special)
export const selectStopIsNearby = (stopId: string) =>
  createSelector(selectNearbyStopIds, (nearbyStopIds) => nearbyStopIds.includes(stopId));

export const selectFavoritesWithLiveData = createSelector(
  selectAllFavoriteIds,
  selectAllStopsSortedByDistance,
  (favoriteIds, sortedStops) => {
    // Create a Set for O(1) lookups of favorite IDs
    const favoriteIdSet = new Set(favoriteIds);

    // Filter the already distance-sorted stops to only include favorites
    return sortedStops.filter((stop) => favoriteIdSet.has(stop.stopId));
  }
);

// Haversine formula to compute distance (in feet)
const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const meters = R * c;
  const feet = meters * 3.28084; // Convert meters to feet
  return feet;
};
