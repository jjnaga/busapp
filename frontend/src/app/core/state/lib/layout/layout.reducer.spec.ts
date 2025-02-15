import { layoutReducer, initialLayoutState } from './layout.reducer';
import { setMobileMode } from './layout.actions';

describe('Layout Reducer', () => {
  it('should return initial state', () => {
    const action = {} as any;
    expect(layoutReducer(undefined, action)).toBe(initialLayoutState);
  });

  it('should handle setMobileMode action', () => {
    const action = setMobileMode({ isMobile: true });
    const state = layoutReducer(initialLayoutState, action);
    expect(state.isMobile).toBe(true);
  });

  it('should handle window resize to desktop size', () => {
    const action = setMobileMode({ isMobile: false });
    const state = layoutReducer(initialLayoutState, action);
    expect(state.isMobile).toBe(false);
  });
});
