import { createAction, props } from '@ngrx/store';
import { Stop } from '../../../utils/global.types';

export const loadStops = createAction('[Stops] Load Stops');

export const loadStopsSuccess = createAction('[Stops] Load Stops Success', props<{ stops: Stop[] }>());

export const loadStopsFailure = createAction('[Stops] Load Stops Failure', props<{ error: string }>());
