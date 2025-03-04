import { createAction } from '@ngrx/store';

// Action dispatched when the app wakes up from sleep/background
export const appWokeUp = createAction('[App] Woke Up From Sleep');
