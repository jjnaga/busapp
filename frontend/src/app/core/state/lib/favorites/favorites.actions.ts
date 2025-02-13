import { createAction, props } from '@ngrx/store';
import { Stop } from '../../../utils/global.types';

export const addFavorite = createAction('[Favorites] Add Favorite', props<{ stop: Stop }>());

export const removeFavorite = createAction('[Favorites] Remove Favorite', props<{ stopId: string }>());
