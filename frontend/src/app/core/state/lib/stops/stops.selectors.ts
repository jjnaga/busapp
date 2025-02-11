import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StopsState } from './stops.reducers';
import { selectUserLocation } from '../user-location/user-location.selectors';

export const selectStopsState = createFeatureSelector<StopsState>('stops');

export const selectAllStops = createSelector(selectStopsState, (state: StopsState) => state.stops);

export const selectStopsLoading = createSelector(selectStopsState, (state: StopsState) => {
  return state.loading;
});

export const selectAllStopsSortedByDistance = createSelector(selectUserLocation, selectAllStops, (userLoc, stops) => {
  const defaultLocation = { latitude: 21.3069, longitude: -157.8583 };

  if (!userLoc || userLoc.longitude === null || userLoc.latitude === null || !stops) return [];

  // Sort stops by distance from user
  return stops
    .filter((stop) => stop && stop.stopLat !== null && stop.stopLon !== null)
    .map((stop) => ({
      ...stop,
      distance: calcDistance(userLoc.latitude!, userLoc.longitude!, stop.stopLat!, stop.stopLon!),
    }))
    .sort((a, b) => a.distance - b.distance);
});

// Haversine formula to compute distance (in meters)
const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
