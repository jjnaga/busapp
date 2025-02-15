import { createAction, props } from '@ngrx/store';
import { Stop } from '../../../utils/global.types';

export const toggleFavoriteAction = createAction('[Favorites] Toggle Favorite', props<{ stop: Stop }>());
