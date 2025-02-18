import { Stop } from '../../../../core/utils/global.types';
import { UserLocationState } from '../../../../core/state/lib/user-location/user-location.reducers';
import { selectAllStopsSortedByDistance } from './stops.selectors';

describe('selectAllStopsSortedByDistance', () => {
  const mockUserLocation: UserLocationState = {
    latitude: 21.3069,
    longitude: -157.8583,
    error: null,
    dateUpdated: new Date(),
  };

  const mockStopsDict: { [key: string]: Stop } = {
    '2': {
      stopId: '2',
      stopLat: 21.5,
      stopLon: -157.9,
      stopCode: '002',
      stopName: 'Stop 2',
      stopUrl: 'http://example.com/2',
      stopSerialNumber: 2,
    },
    '1': {
      stopId: '1',
      stopLat: 21.3069,
      stopLon: -157.8583,
      stopCode: '001',
      stopName: 'Stop 1',
      stopUrl: 'http://example.com/1',
      stopSerialNumber: 1,
    },
    '3': {
      // This stop has a null coordinate so should be filtered out.
      stopId: '3',
      stopLat: null,
      stopLon: -157.8,
      stopCode: '003',
      stopName: 'Stop 3',
      stopUrl: 'http://example.com/3',
      stopSerialNumber: 3,
    },
  };

  test('should sort stops by distance and filter invalid stops', () => {
    const result = selectAllStopsSortedByDistance.projector(mockUserLocation, mockStopsDict);
    expect(result.length).toBe(2);
    expect(result[0].stopId).toBe('1');
    expect(result[1].stopId).toBe('2');
  });

  test('should return empty array if user location is missing', () => {
    const result = selectAllStopsSortedByDistance.projector(null as unknown as UserLocationState, mockStopsDict);
    expect(result).toEqual([]);
  });
});
