import { ActionReducer, MetaReducer } from '@ngrx/store';

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
    if (action.type === '@ngrx/store/init') {
      const saved = localStorage.getItem('app-state');
      if (saved) {
        try {
          const loadedState = JSON.parse(saved, reviver);
          state = { ...state, ...loadedState };
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
