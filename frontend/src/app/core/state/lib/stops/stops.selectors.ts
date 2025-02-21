import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StopsState } from './stops.reducers';
import { selectUserLocation } from '../user-location/user-location.selectors';
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

    if (!selectedStop) return undefined;

    return {
      ...selectedStop,
      stopLat: selectedStop.stopLat,
      stopLon: selectedStop.stopLon,
    };
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
