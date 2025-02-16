import { ActionReducer } from '@ngrx/store';
import { persistState } from './persist-state.meta-reducer';

describe('persistState Meta Reducer', () => {
  let dummyReducer: ActionReducer<any>;

  beforeEach(() => {
    localStorage.clear();
    dummyReducer = (state: any, action: any) => {
      return { ...state, actionType: action.type };
    };
  });

  test('loads state from localStorage on init action with valid JSON', () => {
    const savedState = {
      user: { name: 'John', lastLogin: new Date('2020-01-01T00:00:00Z') },
      favorites: { items: ['a', 'b'] },
    };

    // Use the same replacer function as in the meta reducer for Date serialization
    function replacer(key: string, value: any): any {
      if (value && value.constructor === Date) {
        return { __type__: 'Date', value: value.toISOString() };
      }
      return value;
    }
    localStorage.setItem('app-state', JSON.stringify(savedState, replacer));

    const metaReducer = persistState(dummyReducer);
    const initAction = { type: '@ngrx/store/init' };
    const initialState = { someProp: 123 };

    const newState = metaReducer(initialState, initAction);

    expect(newState).toEqual({
      someProp: 123,
      user: { name: 'John', lastLogin: new Date('2020-01-01T00:00:00Z') },
      favorites: { items: ['a', 'b'] },
      actionType: '@ngrx/store/init',
    });
  });

  test('removes saved state from localStorage if JSON parsing fails', () => {
    // Arrange: Put invalid JSON in localStorage
    localStorage.setItem('app-state', 'invalid json');
    // Spy on Storage.prototype.removeItem since that's what our meta reducer uses
    const removeSpy = jest.spyOn(Storage.prototype, 'removeItem');

    const metaReducer = persistState(dummyReducer);
    const initAction = { type: '@ngrx/store/init' };

    // Act: Call meta reducer to trigger parsing
    metaReducer({}, initAction);

    // Assert: removeItem should be called with the storage key
    expect(removeSpy).toHaveBeenCalledWith('app-state');
  });

  test('saves only user and favorites parts of state to localStorage', () => {
    const metaReducer = persistState(dummyReducer);
    const action = { type: 'TEST_ACTION' };
    const state = {
      user: { name: 'Alice' },
      favorites: { items: [1, 2, 3] },
      other: 'should not persist', // this key should be omitted
    };

    // Act: Run meta reducer so that it persists state
    metaReducer(state, action);

    // Assert: Check that only the user and favorites keys are saved
    const stored = localStorage.getItem('app-state');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toEqual({
      user: { name: 'Alice' },
      favorites: { items: [1, 2, 3] },
    });
  });

  test('serializes Date objects correctly and revives them on JSON parse', () => {
    const metaReducer = persistState(dummyReducer);
    const testDate = new Date('2021-12-31T23:59:59Z');
    const state = {
      user: { lastLogin: testDate },
      favorites: {},
      extra: 'data',
    };

    // Act: Run meta reducer to save state
    metaReducer(state, { type: 'TEST_ACTION' });

    // Simulate app reload by getting state from localStorage
    const stored = localStorage.getItem('app-state');
    expect(stored).not.toBeNull();

    // Run the meta reducer with init action to load saved state
    const loadedState = metaReducer({}, { type: '@ngrx/store/init' });

    // Assert: The Date field should be properly revived
    expect(loadedState.user.lastLogin instanceof Date).toBe(true);
    expect(loadedState.user.lastLogin.getTime()).toBe(testDate.getTime());
  });
});
