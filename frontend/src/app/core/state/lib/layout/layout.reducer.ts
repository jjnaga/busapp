import { createReducer, on } from '@ngrx/store';
import { setMobileMode } from './layout.actions';

export interface LayoutState {
  isMobile: boolean;
}

export const initialLayoutState: LayoutState = {
  isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : true,
};

export const layoutReducer = createReducer(
  initialLayoutState,
  on(setMobileMode, (state, { isMobile }) => ({ ...state, isMobile }))
);
