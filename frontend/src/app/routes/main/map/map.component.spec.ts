import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { MarkerService } from '../../../core/services/marker.service';
import { GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { ToastrModule } from 'ngx-toastr';
import { provideMockStore } from '@ngrx/store/testing';

class MockGoogleMap {
  setOptions = jest.fn();
  addListener = jest.fn((_event, callback) => callback());
  getZoom = jest.fn(() => 16);
  getBounds = jest.fn(() => ({ contains: jest.fn(() => true) }));
  panTo = jest.fn();
  getDiv = jest.fn(() => ({ style: { height: '' } }));
  getCenter = jest.fn(() => ({ lat: 21.3069, lng: -157.8583 })); // Added getCenter
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

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let markerService: MarkerService;
  let fakeMap: any;

  beforeEach(async () => {
    const markerServiceMock = {
      init: jest.fn(),
      updateStopMarkers: jest.fn(),
      updateVehicleMarkers: jest.fn(),
      clearAllMarkers: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, GoogleMapsModule, MapComponent, ToastrModule.forRoot()],
      providers: [{ provide: MarkerService, useValue: markerServiceMock }, provideMockStore()],
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    markerService = TestBed.inject(MarkerService);
    fakeMap = new MockGoogleMap();
  });

  test('should set map options and initialize markerService on map ready', () => {
    component.onMapReady(fakeMap);
    expect(fakeMap.setOptions).toHaveBeenCalledWith(component.mapOptions);
    expect(markerService.init).toHaveBeenCalledWith(fakeMap);
    expect(component.map).toBe(fakeMap);
  });

  it('should adjust map height on window resize (performance test)', fakeAsync(() => {
    fakeMap = new MockGoogleMap();
    component.onMapReady(fakeMap);
    fixture.detectChanges();
    tick(); // flush microtasks
    const panToSpy = fakeMap.panTo;
    // Dispatch multiple resize events rapidly
    for (let i = 0; i < 10; i++) {
      window.dispatchEvent(new Event('resize'));
    }
    tick(200); // increase tick time to allow debounce to fire
    expect(panToSpy).toHaveBeenCalled();
    expect(panToSpy.mock.calls.length).toBeLessThan(10);
  }));
});
