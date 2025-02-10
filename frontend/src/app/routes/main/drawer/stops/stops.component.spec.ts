import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Store } from '@ngrx/store';
import { setSelectedStop } from '../../../../core/state/lib/user/user.actions';
import { StopsComponent } from './stops.components';
import { selectUserLocation } from '../../../../core/state/lib/user-location/user-location.selectors';
import { selectAllStops } from '../../../../core/state/lib/stops/stops.selectors';
import { UserLocationState } from '../../../../core/state/lib/user-location/user-location.reducers';

const defaultLocation: UserLocationState = {
  latitude: 21.3069,
  longitude: -157.8583,
  error: null,
  dateUpdated: null,
};

describe('StopsComponent', () => {
  let component: StopsComponent;
  let fixture: ComponentFixture<StopsComponent>;
  let store: MockStore;
  const initialState = {}; // add more if needed

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StopsComponent],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    store = TestBed.inject(Store) as MockStore;
    jest.spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(StopsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should dispatch setSelectedStop when a stop is clicked in the UI', () => {
    // Use a dummy stop that matches the Stop interface expected by your component
    const stop = {
      stopId: '1',
      stopCode: '1',
      stopName: 'Stop 1',
      stopLat: 10,
      stopLon: 10,
      stopUrl: null,
      stopSerialNumber: null,
    };

    // Simulate stops observable data
    component.sortedStops$ = of([stop]);
    fixture.detectChanges();

    // Update the selector to match your template.
    // For example, if your template uses a button inside an li to trigger the click,
    // query for that button.
    const buttonElement = fixture.debugElement.query(By.css('li button'));
    expect(buttonElement).toBeTruthy(); // Ensure the element exists

    buttonElement.triggerEventHandler('click', null);

    expect(store.dispatch).toHaveBeenCalledWith(setSelectedStop({ stop }));
  });
});

describe('StopsComponent sortedStops$ Observable', () => {
  let component: StopsComponent;
  let fixture: ComponentFixture<StopsComponent>;
  let store: MockStore;
  const initialState = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StopsComponent],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(StopsComponent);
    component = fixture.componentInstance;
  });

  it('should use the default location when no user location is provided', (done) => {
    // Override the selector so that no user location is emitted.
    store.overrideSelector(selectUserLocation, defaultLocation);

    // Provide some dummy stops with valid coordinates.
    const stops = [
      {
        stopId: '1',
        stopCode: '001',
        stopName: 'Stop A',
        stopLat: 22.0,
        stopLon: -158.0,
        stopUrl: null,
        stopSerialNumber: 1,
      },
      {
        stopId: '2',
        stopCode: '002',
        stopName: 'Stop B',
        stopLat: 21.0,
        stopLon: -157.5,
        stopUrl: null,
        stopSerialNumber: 2,
      },
    ];
    store.overrideSelector(selectAllStops, stops);
    fixture.detectChanges();

    component.sortedStops$.subscribe((sortedStops) => {
      // The default location is defined in the component as:
      const defaultLoc = { latitude: 21.3069, longitude: -157.8583 };
      // Use the component's calcDistance method (accessed via 'as any')
      const calcDistance = (component as any).calcDistance.bind(component);
      const expectedSorted = stops.slice().sort((a, b) => {
        return (
          calcDistance(defaultLoc.latitude, defaultLoc.longitude, a.stopLat, a.stopLon) -
          calcDistance(defaultLoc.latitude, defaultLoc.longitude, b.stopLat, b.stopLon)
        );
      });

      expect(sortedStops).toEqual(expectedSorted);
      done();
    });
  });

  it('should sort stops based on the provided user location', (done) => {
    // Provide a user location via the store.
    store.overrideSelector(selectUserLocation, defaultLocation);

    const stops = [
      {
        stopId: '1',
        stopCode: '001',
        stopName: 'Stop A',
        stopLat: 21.0,
        stopLon: -157.0,
        stopUrl: null,
        stopSerialNumber: 1,
      },
      {
        stopId: '2',
        stopCode: '002',
        stopName: 'Stop B',
        stopLat: 19.5,
        stopLon: -155.5,
        stopUrl: null,
        stopSerialNumber: 2,
      },
      {
        stopId: '3',
        stopCode: '003',
        stopName: 'Stop C',
        stopLat: 20.5,
        stopLon: -156.5,
        stopUrl: null,
        stopSerialNumber: 3,
      },
    ];
    store.overrideSelector(selectAllStops, stops);
    fixture.detectChanges();

    component.sortedStops$.subscribe((sortedStops) => {
      const calcDistance = (component as any).calcDistance.bind(component);
      const expectedSorted = stops.slice().sort((a, b) => {
        return (
          calcDistance(defaultLocation.latitude, defaultLocation.longitude, a.stopLat, a.stopLon) -
          calcDistance(defaultLocation.latitude, defaultLocation.longitude, b.stopLat, b.stopLon)
        );
      });
      expect(sortedStops).toEqual(expectedSorted);
      done();
    });
  });

  it('should filter out stops with null coordinates', (done) => {
    store.overrideSelector(selectUserLocation, defaultLocation);

    // Include stops with null lat or lon that should be filtered out.
    const stops = [
      {
        stopId: '1',
        stopCode: '001',
        stopName: 'Stop A',
        stopLat: 21.0,
        stopLon: -157.0,
        stopUrl: null,
        stopSerialNumber: 1,
      },
      {
        stopId: '2',
        stopCode: '002',
        stopName: 'Stop B',
        stopLat: null,
        stopLon: -155.5,
        stopUrl: null,
        stopSerialNumber: 2,
      },
      {
        stopId: '3',
        stopCode: '003',
        stopName: 'Stop C',
        stopLat: 20.5,
        stopLon: null,
        stopUrl: null,
        stopSerialNumber: 3,
      },
    ];
    store.overrideSelector(selectAllStops, stops);
    fixture.detectChanges();

    component.sortedStops$.subscribe((sortedStops) => {
      expect(sortedStops.length).toBe(1);
      expect(sortedStops[0].stopId).toBe('1');
      done();
    });
  });
});
