import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { MarkerService } from '../../../core/services/marker.service';
import { GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { ToastrModule } from 'ngx-toastr';
import { provideMockStore } from '@ngrx/store/testing';

// Mocking google maps for tests
(globalThis as any).google = {
  maps: {
    Map: jest.fn().mockImplementation(() => ({
      setOptions: jest.fn(),
      addListener: jest.fn(),
      getZoom: jest.fn(() => 16),
      getBounds: jest.fn(() => ({
        contains: jest.fn(() => true),
      })),
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
    fakeMap = {
      setOptions: jest.fn(),
      addListener: jest.fn((event, callback) => callback()),
      getZoom: jest.fn(() => 16),
      getBounds: jest.fn(() => ({ contains: jest.fn(() => true) })),
    };
  });

  test('should set map options and initialize markerService on map ready', () => {
    component.onMapReady(fakeMap);
    expect(fakeMap.setOptions).toHaveBeenCalledWith(component.mapOptions);
    expect(markerService.init).toHaveBeenCalledWith(fakeMap);
    expect(component.map).toBe(fakeMap);
  });
});
