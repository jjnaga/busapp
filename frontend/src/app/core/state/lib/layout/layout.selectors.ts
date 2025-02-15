import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LayoutState } from './layout.reducer';

export const selectLayoutState = createFeatureSelector<LayoutState>('layout');

export const selectIsMobile = createSelector(selectLayoutState, (state) => state.isMobile);
