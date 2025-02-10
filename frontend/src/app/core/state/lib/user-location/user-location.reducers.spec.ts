import { userLocationReducer, initialUserLocationState } from './user-location.reducers';
import * as LocationActions from './user-location.actions';

describe('UserLocation Reducer', () => {
  test('should update state on userLocationUpdate', () => {
    const latitude = 10;
    const longitude = 20;
    const action = LocationActions.userLocationUpdate({ latitude, longitude });
    const state = userLocationReducer(initialUserLocationState, action);

    expect(state.latitude).toBe(latitude);
    expect(state.longitude).toBe(longitude);
    expect(state.error).toBeNull();
    expect(state.dateUpdated).toBeInstanceOf(Date);
  });

  test('should update error on userLocationError', () => {
    const error = 'Geolocation error';
    const action = LocationActions.userLocationError({ error });
    const state = userLocationReducer(initialUserLocationState, action);

    expect(state.error).toBe(error);
  });
});
