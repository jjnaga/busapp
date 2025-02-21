// stops.effects.spec.ts
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { StopsEffects } from './stops.effects';
import * as StopsActions from './stops.actions';
import * as UserActions from '../user/user.actions';
import { Stop } from '../../../utils/global.types';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import {
  selectAllStops,
  selectAllStopsSortedByDistance,
  selectSelectedStop,
  selectStopsTrackingValues,
} from './stops.selectors';

describe('StopsEffects', () => {
  let actions$: Observable<any>;
  let effects: StopsEffects;
  let httpMock: HttpTestingController;
  let store: MockStore;
  const stopsLink = 'http://localhost:3000/api/stops';
  const detailedStopLink = (stopId: string) => `http://localhost:3000/api/stops/${stopId}`;

  const mockStop: Stop = {
    stopId: '1',
    stopCode: '001',
    stopName: 'Test Stop',
    stopLat: 10,
    stopLon: 20,
    stopUrl: null,
    stopSerialNumber: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        StopsEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [
            { selector: selectAllStops, value: { '1': mockStop } },
            { selector: selectSelectedStop, value: null },
            { selector: selectStopsTrackingValues, value: [] },
          ],
        }),
      ],
    });

    effects = TestBed.inject(StopsEffects);
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(MockStore);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load stops successfully on loadStops action', (done) => {
    const stopsArray: Stop[] = [mockStop];
    actions$ = of(StopsActions.loadStops());
    effects.loadStops$.subscribe((action) => {
      expect(action).toEqual(StopsActions.loadStopsSuccess({ stops: stopsArray }));
      done();
    });
    const req = httpMock.expectOne(stopsLink);
    expect(req.request.method).toBe('GET');
    req.flush({ data: stopsArray });
  });

  it('should dispatch loadStopsFailure on loadStops error', (done) => {
    const errorMsg = 'Error occurred';

    // Set up the action
    actions$ = of(StopsActions.loadStops());

    // Subscribe to the effect before triggering the error
    effects.loadStops$.subscribe({
      next: (action) => {
        try {
          expect(action).toEqual(
            StopsActions.loadStopsFailure({ error: 'Http failure response for http://localhost:3000/api/stops: 0 ' })
          );
          done();
        } catch (err) {
          done(err);
        }
      },
      error: (err) => done(err),
    });

    // Trigger the HTTP error after subscription is set up
    const req = httpMock.expectOne(stopsLink);
    expect(req.request.method).toBe('GET');

    // Simulate the error response
    req.error(
      new ErrorEvent('Network error', {
        error: new Error(errorMsg),
      })
    );
  });

  it('should navigate to next stop on nextStop action', (done) => {
    const stopsSorted = [
      { ...mockStop, distance: 100, stopLat: 10, stopLon: 20 },
      { ...mockStop, stopId: '2', stopName: 'Stop 2', stopLat: 15, stopLon: 25, distance: 200 },
    ];

    store.overrideSelector(selectAllStopsSortedByDistance, stopsSorted); // Override with sorted array
    store.overrideSelector(selectSelectedStop, mockStop);

    actions$ = of(StopsActions.nextStop());
    effects.navigateStops$.subscribe((action) => {
      console.log(action);
      expect(action).toEqual(UserActions.setSelectedStop({ stop: stopsSorted[1] }));
      done();
    });
  });

  it('should dispatch startTrackingStops on setSelectedStop when stop is provided', (done) => {
    actions$ = of(UserActions.setSelectedStop({ stop: mockStop }));
    effects.updateStopsTrackingOnSelectedStop$.subscribe((action) => {
      expect(action).toEqual(StopsActions.startTrackingStops({ stopIds: [mockStop.stopId] }));
      done();
    });
  });

  it('should not dispatch any action on setSelectedStop with null', (done) => {
    actions$ = of(UserActions.setSelectedStop({ stop: null }));
    effects.updateStopsTrackingOnSelectedStop$.subscribe({
      next: () => {
        fail('Expected no action to be dispatched');
      },
      complete: () => done(),
    });
  });

  it('should dispatch loadDetailedStops periodically when stopsTracking is not empty', fakeAsync(() => {
    store.overrideSelector(selectStopsTrackingValues, [mockStop.stopId]);
    store.refreshState();

    let count = 0;
    const sub = effects.loadTrackedStops$.subscribe((action) => {
      expect(action).toEqual(StopsActions.loadDetailedStops({ stopIds: [mockStop.stopId] }));
      count++;
    });

    tick(16000);
    expect(count).toBeGreaterThan(0);
    sub.unsubscribe();
  }));
});
