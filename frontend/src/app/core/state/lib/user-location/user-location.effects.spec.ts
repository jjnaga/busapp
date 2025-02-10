import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { UserLocationEffects } from './user-location.effects';
import * as LocationActions from './user-location.actions';
import { UserLocationService } from '../../../services/user-location.service';

describe('UserLocationEffects', () => {
  let actions$: Observable<any>;
  let effects: UserLocationEffects;
  let userLocationService: any;

  beforeEach(() => {
    userLocationService = {
      watchLocation: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UserLocationEffects,
        provideMockActions(() => actions$),
        { provide: UserLocationService, useValue: userLocationService },
      ],
    });

    effects = TestBed.inject(UserLocationEffects);
  });

  test('should dispatch userLocationUpdate on successful location watch', (done) => {
    const coords = { latitude: 10, longitude: 20 };
    actions$ = of(LocationActions.startLocationTracking());
    userLocationService.watchLocation.mockReturnValue(of(coords));

    effects.trackLocation$.subscribe((action) => {
      expect(action).toEqual(
        LocationActions.userLocationUpdate({ latitude: coords.latitude, longitude: coords.longitude })
      );
      done();
    });
  });

  test('should dispatch userLocationError on failure', (done) => {
    const error = 'Location error';
    actions$ = of(LocationActions.startLocationTracking());
    userLocationService.watchLocation.mockReturnValue(throwError(error));

    effects.trackLocation$.subscribe((action) => {
      expect(action).toEqual(LocationActions.userLocationError({ error }));
      done();
    });
  });
});
