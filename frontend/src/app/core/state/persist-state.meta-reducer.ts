import { ActionReducer, MetaReducer } from '@ngrx/store';
import { DrawerMode } from '../utils/global.types';

const SOFT_RESET_INTERVAL = 1000 * 60 * 10; // 10 minutes

function replacer(key: string, value: any): any {
  if (value instanceof Date) {
    return { __type__: 'Date', value: value.toISOString() };
  }
  return value;
}

function reviver(key: string, value: any): any {
  // If the value is the custom wrapped Date
  if (value && value.__type__ === 'Date') {
    return new Date(value.value);
  }
  // If the value is a string in ISO date format, revive it as Date.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    return new Date(value);
  }
  return value;
}

export function persistState(reducer: ActionReducer<any>): ActionReducer<any> {
  return function (state: any, action: any) {
    // Always get the next state first
    let nextState = reducer(state, action);

    if (action.type === '@ngrx/store/init') {
      const saved = localStorage.getItem('app-state');
      if (saved) {
        try {
          const loadedState = JSON.parse(saved, reviver);

          // Merge with next state instead of undefined initial state
          nextState = {
            ...nextState,
            user: {
              ...nextState.user,
              ...loadedState.user,
            },
            favorites: {
              ...nextState.favorites,
              ...loadedState.favorites,
            },
          };

          if (loadedState?.user?.lastActive) {
            const lastActive = new Date(loadedState.user.lastActive);
            const timeDiff = new Date().getTime() - lastActive.getTime();

            if (timeDiff > SOFT_RESET_INTERVAL) {
              nextState = {
                ...nextState,
                user: {
                  ...nextState.user, // Use feature defaults
                  stopPreferences: loadedState.user.stopPreferences || {},
                  drawerMode: DrawerMode.Home,
                  drawerExpanded: true,
                  selectedStop: null,
                  selectedArrivalIndex: null,
                },
              };
            }
          }
        } catch (e) {
          console.error('Error:', e);
        }
      }
    }

    // Save state after all modifications
    const stateToSave = {
      user: nextState.user,
      favorites: nextState.favorites,
    };
    localStorage.setItem('app-state', JSON.stringify(stateToSave, replacer));

    return nextState;
  };
}

export function updateLastActiveMetaReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return (state, action) => {
    const nextState = reducer(state, action);
    if (nextState?.user) {
      return {
        ...nextState,
        user: {
          ...nextState.user,
          lastActive: new Date(),
        },
      };
    }
    return nextState;
  };
}

export const metaReducers: MetaReducer<any>[] = [updateLastActiveMetaReducer, persistState];
