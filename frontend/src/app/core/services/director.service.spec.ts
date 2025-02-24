// director.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { DirectorService, CameraMode } from './director.service';
import { FreeFormCameraStrategy } from '../services/camera-strategies/free.camera';
import { UserCameraStrategy } from '../services/camera-strategies/user.camera';
import { IncomingBusCameraStrategy } from '../services/camera-strategies/incoming-bus.camera';
import { MarkerService } from '../services/markers/marker.service';
import { MapControllerService } from './maps/map-controller.service';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';

// Create fake spy objects for the strategies
const freeFormStrategySpy = {
  execute: jest.fn(),
  cleanup: jest.fn(),
};

const userCameraStrategySpy = {
  execute: jest.fn(),
  cleanup: jest.fn(),
};

const incomingBusCameraStrategySpy = {
  execute: jest.fn(),
  cleanup: jest.fn(),
};

// Fake marker service spy (we don’t need to test its internals here)
const markerServiceSpy = {
  updateVehicleMarkers: jest.fn(),
  updateStopMarkers: jest.fn(),
};

// Create a fake map object (we only care about its identity here)
const fakeMap: google.maps.Map = {} as google.maps.Map;

// Create a fake MapController to pass into strategies (with minimal implementation)
const fakeMapController = {
  panAndZoom: jest.fn(),
  fitBounds: jest.fn(),
  getBounds: jest.fn(() => undefined),
  updateZoom: jest.fn(),
  getZoom: jest.fn(() => 16),
  zoom$: of(16),
  emitMapEvent: jest.fn(), // Add this
};

// Update store mock configuration
const initialState = {
  vehicles: {
    entities: {},
    ids: [],
  },
  stops: {
    entities: {},
    ids: [],
  },
  user: {
    selectedArrivalIndex: null,
  },
};

describe('DirectorService', () => {
  let service: DirectorService;
  let store: MockStore;
  let mapControllerService: MapControllerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DirectorService,
        { provide: FreeFormCameraStrategy, useValue: freeFormStrategySpy },
        { provide: UserCameraStrategy, useValue: userCameraStrategySpy },
        { provide: IncomingBusCameraStrategy, useValue: incomingBusCameraStrategySpy },
        { provide: MarkerService, useValue: markerServiceSpy },
        { provide: MapControllerService, useValue: fakeMapController },
        provideMockStore({
          initialState,
        }),
      ],
    });
    service = TestBed.inject(DirectorService);
    store = TestBed.inject(MockStore);
    mapControllerService = TestBed.inject(MapControllerService);

    // Reset all spy calls before each test
    jest.clearAllMocks();
  });

  // Test that on initialization, the DirectorService is in FREE_FORM mode.
  test('should default to FREE_FORM mode on initialization', () => {
    expect((service as any).currentMode).toBe(CameraMode.FREE_FORM);
    expect((service as any).currentStrategy).toBe(freeFormStrategySpy);
  });

  // Test mode switching: when switching to USER mode with a map already set,
  // the service should clean up the previous strategy and execute the new one.
  test('should switch to USER mode and execute corresponding strategy when map is ready', () => {
    // Set a map so that the execute call will actually fire
    service.setMap(fakeMap);
    // Now switch mode to USER
    service.setUserMode();

    // The previous (FREE_FORM) strategy cleanup should be called
    expect(freeFormStrategySpy.cleanup).toHaveBeenCalled();
    // And the USER strategy's execute should be called with our fakeMapController
    expect(userCameraStrategySpy.execute).toHaveBeenCalledWith(fakeMapController);
    expect((service as any).currentMode).toBe(CameraMode.USER);
    expect((service as any).currentStrategy).toBe(userCameraStrategySpy);
  });

  // Test mode switching for INCOMING_BUS mode.
  test('should switch to INCOMING_BUS mode and execute corresponding strategy when map is ready', () => {
    service.setMap(fakeMap);
    service.setIncomingBusMode();

    expect(freeFormStrategySpy.cleanup).toHaveBeenCalled();
    expect(incomingBusCameraStrategySpy.execute).toHaveBeenCalledWith(fakeMapController);
    expect((service as any).currentMode).toBe(CameraMode.INCOMING_BUS);
    expect((service as any).currentStrategy).toBe(incomingBusCameraStrategySpy);
  });

  // Test that setMap sets the map, defaults to FREE_FORM mode, and calls the marker managers.
  test('setMap should set map and default mode to FREE_FORM and start marker managers', () => {
    // Spy on the internal marker manager methods
    const vehiclesManagerSpy = jest.spyOn(service as any, 'startVehiclesMarkerManager');
    const stopsManagerSpy = jest.spyOn(service as any, 'startStopsMarkerManager');

    service.setMap(fakeMap);

    // Check that the map is set
    expect((service as any).mapReadySubject.getValue()).toBe(fakeMap);
    // It should default to FREE_FORM mode (and thus, execute freeForm strategy)
    expect((service as any).currentMode).toBe(CameraMode.FREE_FORM);
    expect(vehiclesManagerSpy).toHaveBeenCalled();
    expect(stopsManagerSpy).toHaveBeenCalled();

    // Add a small delay to allow for async operations
    setTimeout(() => {
      expect(freeFormStrategySpy.execute).toHaveBeenCalledWith(fakeMapController);
    }, 0);
  });
});
