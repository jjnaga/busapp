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
  return value;
}

export function persistState(reducer: ActionReducer<any>): ActionReducer<any> {
  const storageKey = 'app-state';
  const maxAge = 10 * 60 * 1000; // 10 minutes in milliseconds

  return (state, action) => {
    // Get the next state first
    const nextState = reducer(state, action);

    // Handle state hydration on init
    if (action.type === '@ngrx/store/init') {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState, reviver);
          const lastActive = new Date(parsedState.user?.lastActive);
          const isStateFresh = lastActive && Date.now() - lastActive.getTime() < maxAge;

          if (isStateFresh) {
            // Only hydrate if the features exist in the current state
            const hydratedState = { ...nextState };

            if ('user' in parsedState) {
              hydratedState.user = parsedState.user;
            }
            if ('favorites' in parsedState) {
              hydratedState.favorites = parsedState.favorites;
            }

            return hydratedState;
          } else {
            localStorage.removeItem(storageKey);
          }
        } catch (error) {
          console.error('Error hydrating state:', error);
          localStorage.removeItem(storageKey);
        }
      }
    }

    // Persist state changes
    if (nextState?.user?.lastActive) {
      const stateToSave = {
        user: nextState.user,
        favorites: nextState.favorites,
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave, replacer));
    }

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
