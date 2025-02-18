import { Stop } from './global.types';

export const isValidLocation = (loc: any): loc is { latitude: number; longitude: number } => {
  return typeof loc?.latitude === 'number' && typeof loc?.longitude === 'number';
};

export const isValidStop = (stop: any): stop is Stop & { stopLat: number; stopLon: number } => {
  return (
    stop !== null &&
    typeof stop === 'object' &&
    typeof stop.stopLat === 'number' &&
    typeof stop.stopLon === 'number' &&
    !isNaN(stop.stopLat) &&
    !isNaN(stop.stopLon)
  );
};
