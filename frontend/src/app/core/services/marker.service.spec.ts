import { ToastrService } from 'ngx-toastr';
import { Stop } from '../utils/global.types';
import { MarkerService } from './marker.service';
import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

const mockGoogleMaps = {
  LatLng: jest.fn((lat, lng) => ({ lat, lng })),
  marker: {
    AdvancedMarkerElement: jest.fn().mockImplementation(() => ({
      position: null,
      remove: jest.fn(),
      addListener: jest.fn(),
    })),
  },
};

window.google = {
  maps: mockGoogleMaps,
} as any;

describe('MarkerService', () => {
  let markerService: MarkerService;
  const mockMap = {
    getZoom: jest.fn(() => 16),
    getBounds: jest.fn(() => ({
      contains: jest.fn(() => true),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideMockStore({}),
        {
          provide: ToastrService,
          useValue: { success: jest.fn(), error: jest.fn() },
        },
      ],
    });

    TestBed.runInInjectionContext(() => {
      markerService = new MarkerService();
      markerService.init(mockMap as unknown as google.maps.Map);
    });
  });

  test('should not create marker for invalid coordinates', () => {
    const invalidStop = {
      stopId: '3',
      stopLat: null,
      stopLon: null,
      stopName: 'Invalid Stop',
    } as unknown as Stop;

    markerService.updateStopMarkers([invalidStop], 15);

    expect(markerService['stopMarkers']?.size || 0).toBe(0);
  });

  test('should clear all markers', () => {
    const invalidStop = { stopId: '1', stopLat: 10, stopLon: 20 } as Stop;
    markerService.updateStopMarkers([invalidStop], 15);
    markerService.clearAllMarkers();

    expect(markerService['stopMarkers'].size).toBe(0);
    expect(markerService['vehicleMarkers'].size).toBe(0);
    expect(markerService.getUserMarker()).toBeNull();
  });
});
