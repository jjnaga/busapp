// vehicles.effects.spec.ts
import { TestBed } from '@angular/core/testing';
import { VehiclesEffects } from './vehicles.effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import * as VehiclesActions from './vehicles.actions';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Vehicle } from '../../../utils/global.types';

describe('VehiclesEffects', () => {
  let actions$: Observable<any>;
  let effects: VehiclesEffects;
  let httpMock: HttpTestingController;
  const vehiclesLink = 'http://localhost:3000/api/vehicles';

  const mockVehicle: Vehicle = {
    busNumber: '100',
    tripId: 'v1',
    driver: 'John',
    latitude: 10,
    longitude: 10,
    adherence: 0,
    heartbeat: new Date(),
    routeName: 'Route 1',
    headsign: 'Downtown',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VehiclesEffects, provideMockActions(() => actions$)],
    });

    effects = TestBed.inject(VehiclesEffects);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should dispatch loadVehiclesSuccess on successful loadVehicles', (done) => {
    actions$ = of({ type: VehiclesActions.loadVehicles.type });
    effects.loadVehicles$.subscribe((action) => {
      expect(action).toEqual(VehiclesActions.loadVehiclesSuccess({ vehicles: [mockVehicle] }));
      done();
    });
    const req = httpMock.expectOne(vehiclesLink);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [mockVehicle] });
  });

  it('should dispatch loadVehiclesFailure on loadVehicles error', (done) => {
    const errorMsg = 'Network error';
    actions$ = of({ type: VehiclesActions.loadVehicles.type });

    effects.loadVehicles$.subscribe({
      next: (action) => {
        try {
          expect(action).toEqual(
            VehiclesActions.loadVehiclesFailure({
              error: 'Http failure response for http://localhost:3000/api/vehicles: 500 Network error',
            })
          );
          done();
        } catch (err) {
          done(err);
        }
      },
      error: (err) => done(err),
    });

    const req = httpMock.expectOne(vehiclesLink);
    expect(req.request.method).toBe('GET');
    req.error(new ErrorEvent('Network error'), {
      status: 500,
      statusText: errorMsg,
    });
  });
});
