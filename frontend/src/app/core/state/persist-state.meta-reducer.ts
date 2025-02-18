import { ActionReducer, MetaReducer } from '@ngrx/store';

function replacer(_key: string, value: any): any {
  if (value && value.constructor === Date) {
    return { __type__: 'Date', value: value.toISOString() };
  }
  return value;
}

function reviver(key: string, value: any): any {
  if (value && value.__type__ === 'Date') {
    return new Date(value.value);
  }

  if (key === 'lastLogin' && typeof value === 'string' && !isNaN(Date.parse(value))) {
    return new Date(value);
  }
  return value;
}

export function persistState(reducer: ActionReducer<any>): ActionReducer<any> {
  const storageKey = 'app-state';

  return (state, action) => {
    // On initialization, load saved state from localStorage
    if (action.type === '@ngrx/store/init') {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState, reviver);
          state = { ...state, ...parsedState };
        } catch (error) {
          Storage.prototype.removeItem.call(localStorage, storageKey);
        }
      }
    }

    const nextState = reducer(state, action);

    // Persist only the user and favorites parts of state
    const stateToSave = {
      user: nextState.user,
      favorites: nextState.favorites,
    };

    localStorage.setItem(storageKey, JSON.stringify(stateToSave, replacer));

    return nextState;
  };
}

export const metaReducers: MetaReducer<any>[] = [persistState];
