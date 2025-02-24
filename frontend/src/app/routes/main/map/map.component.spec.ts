import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { MarkerService } from '../../../core/services/markers/marker.service';
import { GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { ToastrModule } from 'ngx-toastr';
import { provideMockStore } from '@ngrx/store/testing';
import { Vehicle } from '../../../core/utils/global.types';
import { EntityState } from '@ngrx/entity';

// Mock Google Maps API
const mockGoogleMaps = {
  ControlPosition: {
    BOTTOM_LEFT: 6, // Google Maps uses numbers for control positions
    TOP_LEFT: 1,
    TOP_RIGHT: 2,
    // ... other positions as needed
  },
  Map: jest.fn(),
  LatLng: jest.fn((lat, lng) => ({ lat, lng })),
  // ... other needed Google Maps objects
};

// Set up global google object
window.google = {
  maps: mockGoogleMaps,
} as any;

class MockGoogleMap {
  setOptions = jest.fn();
  addListener = jest.fn((_event, callback) => callback());
  getZoom = jest.fn(() => 16);
  getBounds = jest.fn(() => ({ contains: jest.fn(() => true) }));
  panTo = jest.fn();
  getDiv = jest.fn(() => ({ style: { height: '' } }));
  getCenter = jest.fn(() => ({ lat: 21.3069, lng: -157.8583 })); // Added getCenter
}

interface TestState {
  vehicles: EntityState<Vehicle>;
  stops: {
    ids: string[];
    entities: { [key: string]: any };
    stopsTracking: { [key: string]: boolean };
    loading: boolean;
  };
}

(globalThis as any).google = {
  maps: {
    Map: jest.fn().mockImplementation(() => ({
      setOptions: jest.fn(),
      addListener: jest.fn((_event, callback) => callback()),
      getZoom: jest.fn(() => 16),
      getBounds: jest.fn(() => ({ contains: jest.fn(() => true) })),
      panTo: jest.fn(),
      getCenter: jest.fn(() => ({ lat: 21.3069, lng: -157.8583 })),
    })),
    LatLng: jest.fn().mockImplementation((lat, lng) => ({ lat, lng })),
    LatLngLiteral: jest.fn(),
    MapOptions: jest.fn(),
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

// Add initial state interface
interface TestState {
  vehicles: EntityState<Vehicle>;
}

// Add mock vehicles
const mockVehicles: Vehicle[] = [
  {
    busNumber: 'BUS001',
    tripId: 'TRIP123',
    driver: 'John Doe',
    latitude: 21.3069,
    longitude: -157.8583,
    adherence: 0,
    heartbeat: new Date(),
    heartbeatFormatted: '2024-02-23 12:00:00',
    routeName: 'Route 1',
    headsign: 'Downtown',
  },
  {
    busNumber: 'BUS002',
    tripId: 'TRIP456',
    driver: 'Jane Smith',
    latitude: 21.307,
    longitude: -157.8584,
    adherence: 1,
    heartbeat: new Date(),
    heartbeatFormatted: '2024-02-23 12:00:00',
    routeName: 'Route 2',
    headsign: 'Airport',
  },
];

// If you need it as a dictionary:
const mockVehicleEntities: { [id: string]: Vehicle } = {
  BUS001: mockVehicles[0],
  BUS002: mockVehicles[1],
};

// Create initial state
const initialState: Partial<TestState> = {
  vehicles: {
    ids: mockVehicles.map((v) => v.busNumber),
    entities: mockVehicleEntities,
  },
  stops: {
    ids: [], // Empty array – adjust as needed for other tests.
    entities: {}, // No stops defined; prevents selector from crashing.
    stopsTracking: {},
    loading: false,
  },
};

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let markerService: MarkerService;
  let fakeMap: any;

  beforeEach(async () => {
    const markerServiceMock = {
      init: jest.fn(),
      updateVehicleMarkers: jest.fn(),
      clearAllMarkers: jest.fn(),
    };

    const mockControls = {
      [mockGoogleMaps.ControlPosition.BOTTOM_LEFT]: {
        push: jest.fn(),
      },
    };

    const mockMap = {
      controls: mockControls,
      setOptions: jest.fn(),
      addListener: jest.fn(),
      panTo: jest.fn(),
      getCenter: jest.fn(),
      setZoom: jest.fn(),
      getZoom: jest.fn(),
      getBounds: jest.fn(),
      getDiv: jest.fn().mockReturnValue({ style: {} }),
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, GoogleMapsModule, MapComponent, ToastrModule.forRoot()],
      providers: [
        { provide: MarkerService, useValue: markerServiceMock },
        provideMockStore({
          initialState,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    markerService = TestBed.inject(MarkerService);
    fakeMap = new MockGoogleMap();

    // Trigger onMapReady with mock map
    component.onMapReady(mockMap as unknown as google.maps.Map);
  });

  test('should set map options and initialize markerService on map ready', () => {
    component.onMapReady(fakeMap);
    expect(fakeMap.setOptions).toHaveBeenCalledWith(component.mapOptions);
    expect(markerService.init).toHaveBeenCalledWith(fakeMap);
    expect(component.map).toBe(fakeMap);
  });

  // it('should adjust map height on window resize (performance test)', fakeAsync(() => {
  //   fakeMap = new MockGoogleMap();
  //   component.onMapReady(fakeMap);
  //   fixture.detectChanges();
  //   tick(); // flush microtasks
  //   const panToSpy = fakeMap.panTo;
  //   // Dispatch multiple resize events rapidly
  //   for (let i = 0; i < 10; i++) {
  //     window.dispatchEvent(new Event('resize'));
  //   }
  //   tick(200); // increase tick time to allow debounce to fire
  //   expect(panToSpy).toHaveBeenCalled();
  //   expect(panToSpy.mock.calls.length).toBeLessThan(10);
  // }));

  // it('should add location button to map controls', () => {
  //   expect(component.map?.controls[google.maps.ControlPosition.BOTTOM_LEFT].push).toHaveBeenCalled();
  // });
});
