import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * DrawerLayoutMetrics tracks layout information shared between the Drawer and Map components.
 * We keep the contract intentionally simple so the map can react without knowing any UI details.
 */
export interface DrawerLayoutMetrics {
  /** Visible drawer height in pixels so the map can compensate for bottom overlays. */
  height: number;
  /** Visible drawer width in pixels so the map can offset desktop side rails. */
  width: number;
  /** Where the drawer anchors from – used to infer how padding should be applied. */
  anchor: 'bottom' | 'right';
  /** Distance from the drawer to the viewport bottom. Useful when the drawer floats. */
  offsetBottom: number;
  /** Distance from the drawer to the viewport right edge for side-docked layouts. */
  offsetRight: number;
}

@Injectable({ providedIn: 'root' })
export class MapLayoutService {
  /** Default metrics keep the map in a neutral state until the drawer measures itself. */
  private readonly defaultMetrics: DrawerLayoutMetrics = {
    height: 0,
    width: 0,
    anchor: 'bottom',
    offsetBottom: 0,
    offsetRight: 0,
  };

  /** Drawer sizing stream shared with the map. */
  private readonly drawerMetrics = new BehaviorSubject<DrawerLayoutMetrics>({ ...this.defaultMetrics });

  drawerMetrics$ = this.drawerMetrics.asObservable();
  visibleDrawerHeight$ = this.drawerMetrics$.pipe(map((metrics) => metrics.height));
  visibleDrawerWidth$ = this.drawerMetrics$.pipe(map((metrics) => metrics.width));

  /**
   * Update specific metrics while keeping previous values for fields we did not recalculate.
   */
  updateDrawerMetrics(partial: Partial<DrawerLayoutMetrics>) {
    this.drawerMetrics.next({ ...this.drawerMetrics.value, ...partial });
  }

  /** Legacy helper so existing mobile-only logic keeps working. */
  updateDrawerHeight(height: number) {
    this.updateDrawerMetrics({ height });
  }

  /** Reset metrics when the drawer unmounts so the map can fall back to defaults. */
  resetDrawerMetrics() {
    this.drawerMetrics.next({ ...this.defaultMetrics });
  }
}
