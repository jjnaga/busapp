import { userReducer, initialUserState } from './user.reducers';
import { setDrawerMode, toggleDrawerExpanded, setSelectedStop } from './user.actions';
import { DrawerMode, Stop } from '../../../utils/global.types';

describe('User Reducer', () => {
  test('should update drawer mode on setDrawerMode', () => {
    const action = setDrawerMode({ drawerMode: DrawerMode.Favorites });
    const state = userReducer(initialUserState, action);
    expect(state.drawerMode).toBe(DrawerMode.Favorites);
  });

  test('should toggle drawerExpanded when no explicit value is provided', () => {
    const action = toggleDrawerExpanded({});
    const state = userReducer(initialUserState, action);
    expect(state.drawerExpanded).toBe(true);
  });

  test('should set drawerExpanded to the provided value', () => {
    const action = toggleDrawerExpanded({ expanded: false });
    const currentState = { ...initialUserState, drawerExpanded: true };
    const state = userReducer(currentState, action);
    expect(state.drawerExpanded).toBe(false);
  });

  test('should set selectedStop on setSelectedStop', () => {
    const dummyStop: Stop = {
      stopId: '1',
      stopCode: '001',
      stopName: 'Test Stop',
      stopLat: 10,
      stopLon: 20,
      stopUrl: null,
      stopSerialNumber: 1,
    };
    const action = setSelectedStop({ stop: dummyStop });
    const state = userReducer(initialUserState, action);
    expect(state.selectedStop).toEqual(dummyStop.stopId);
  });

  test('should update selectedStop on setSelectedStop when changing the selected stop', () => {
    const initialStop: Stop = {
      stopId: '1',
      stopCode: '001',
      stopName: 'Initial Stop',
      stopLat: 10,
      stopLon: 20,
      stopUrl: null,
      stopSerialNumber: 1,
    };
    const newStop: Stop = {
      stopId: '2',
      stopCode: '002',
      stopName: 'Updated Stop',
      stopLat: 30,
      stopLon: 40,
      stopUrl: null,
      stopSerialNumber: 2,
    };
    const currentState = { ...initialUserState, selectedStop: initialStop.stopId };
    const action = setSelectedStop({ stop: newStop });
    const state = userReducer(currentState, action);
    expect(state.selectedStop).toEqual(newStop.stopId);
  });

  test('should clear selectedStop when setSelectedStop is called with null', () => {
    const currentState = { ...initialUserState, selectedStop: '1' };
    const action = setSelectedStop({ stop: null });
    const state = userReducer(currentState, action);
    expect(state.selectedStop).toBeUndefined();
  });
});
