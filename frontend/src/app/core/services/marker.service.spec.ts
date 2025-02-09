// marker.service.spec.ts
import { MarkerService } from './marker.service';
import { Stop } from '../utils/global.types';

describe('MarkerService', () => {
  let markerService: MarkerService;
  let fakeMap: any;

  beforeEach(() => {
    markerService = new MarkerService();

    fakeMap = {
      getZoom: jest.fn(() => 16),
      getBounds: jest.fn(() => ({
        contains: jest.fn((position: any) => position.lat >= 0 && position.lng >= 0),
      })),
      setOptions: jest.fn(),
      addListener: jest.fn((event: string, callback: Function) => {
        callback();
      }),
    };

    // Mocking google maps AdvancedMarkerElement properly
    (globalThis as any).google = {
      maps: {
        LatLng: jest.fn((lat, lng) => ({ lat, lng })),
        marker: {
          AdvancedMarkerElement: jest.fn().mockImplementation((options) => ({
            ...options,
            position: options.position,
            map: options.map,
            addListener: jest.fn(),
            remove: jest.fn(),
          })),
        },
      },
    };
  });

  test('should initialize map', () => {
    markerService.init(fakeMap);
    expect(markerService['map']).toBe(fakeMap);
  });

  test('should add stop marker if in bounds and zoom is sufficient', () => {
    const stops: Stop[] = [
      {
        stopId: '1',
        stopCode: '1',
        stopName: 'Stop 1',
        stopLat: 10,
        stopLon: 10,
        stopUrl: null,
        stopSerialNumber: null,
      },
    ];

    markerService.init(fakeMap);
    markerService.updateStopMarkers(stops, 15);
    expect(markerService['stopMarkers'].has('1')).toBe(true);
  });

  test('should remove stop marker if out of bounds', () => {
    const stop: Stop = {
      stopId: '2',
      stopCode: '2',
      stopName: 'Stop 2',
      stopLat: -10, // Out of bounds
      stopLon: -10, // Out of bounds
      stopUrl: null,
      stopSerialNumber: null,
    };

    markerService.init(fakeMap);

    // Manually adding a marker (which will be out of bounds)
    const fakeMarker = new google.maps.marker.AdvancedMarkerElement({
      position: new google.maps.LatLng(stop.stopLat!, stop.stopLon!),
      map: fakeMap,
    });

    markerService['stopMarkers'].set(stop.stopId, fakeMarker);

    // Trigger the marker update, expecting out-of-bounds marker removal
    markerService.updateStopMarkers([stop], 15);

    // Check if the marker was removed
    expect(markerService['stopMarkers'].has(stop.stopId)).toBe(false);
    expect(fakeMarker.remove).toHaveBeenCalled();
  });

  test('should clear all markers', () => {
    const fakeMarker1 = new google.maps.marker.AdvancedMarkerElement({ position: { lat: 0, lng: 0 } });
    const fakeMarker2 = new google.maps.marker.AdvancedMarkerElement({ position: { lat: 1, lng: 1 } });

    markerService['stopMarkers'].set('1', fakeMarker1);
    markerService['vehicleMarkers'].set('v1', fakeMarker2);

    markerService.clearAllMarkers();

    expect(markerService['stopMarkers'].size).toBe(0);
    expect(markerService['vehicleMarkers'].size).toBe(0);
    expect(fakeMarker1.remove).toHaveBeenCalled();
    expect(fakeMarker2.remove).toHaveBeenCalled();
  });
});
