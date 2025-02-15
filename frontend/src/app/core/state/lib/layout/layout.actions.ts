import { createAction, props } from '@ngrx/store';

export const setMobileMode = createAction('[Layout] Set Mobile Mode', props<{ isMobile: boolean }>());
