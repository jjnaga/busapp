import { ActionReducer, MetaReducer } from '@ngrx/store';
import { last } from 'rxjs';

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
    if (action.type === '[App] Reset Store') {
      localStorage.removeItem('app-state');
      state = undefined; // Wipe everything
    }

    if (action.type === '@ngrx/store/init') {
      const saved = localStorage.getItem('app-state');
      if (saved) {
        try {
          const loadedState = JSON.parse(saved, reviver);
          if (loadedState && loadedState.user && loadedState.user.lastActive) {
            let lastActive = new Date(loadedState.user.lastActive);
            // If last active is older than the soft reset interval, reset the state.
            if (new Date().getTime() - lastActive.getTime() > 1) {
              console.log('RUH ROH RESET');
              localStorage.removeItem('app-state');
              state = {
                ...state,
                favorites: {
                  ...state.favorites, // Keep default values
                  ...loadedState.favorites, // Override with saved values
                },
              };
              lastActive = new Date();
            }
          }
          // Deep merge for each feature
          state = {
            ...state,
            user: {
              ...state.user, // Keep default values
              ...loadedState.user, // Override with saved values
            },
            favorites: {
              ...state.favorites, // Keep default values
              ...loadedState.favorites, // Override with saved values
            },
          };
        } catch (e) {
          // If parsing fails, remove the corrupted saved state.
          localStorage.removeItem('app-state');
        }
      }
    }
    const nextState = reducer(state, action);
    // Persist only the user and favorites parts of state.
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
