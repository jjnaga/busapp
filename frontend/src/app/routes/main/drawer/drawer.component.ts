import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Subject, combineLatest, take, takeUntil, timer } from 'rxjs';
import { map } from 'rxjs/operators';

import { DrawerMode } from '../../../core/utils/global.types';
import { selectAllStops, selectSelectedStop, selectStopsLoading } from '../../../core/state/lib/stops/stops.selectors';
import { selectDrawerExpanded, selectDrawerMode } from '../../../core/state/lib/user/user.selectors';
import { toggleDrawerExpanded } from '../../../core/state/lib/user/user.actions';
import { BottomMenuComponent } from '../bottom-menu/bottom-menu.component';
import { StopComponent } from './stop/stop.component';
import { FvoritesComponent } from './favorites/favorites.components';
import { HomeComponent } from './home/home.component';
import { MapLayoutService } from '../../../core/services/maps/map-layout.service';
import { selectIsMobile } from '../../../core/state/lib/layout/layout.selectors';
import { MarqueeIfOverflowDirective } from '../../../core/utils/directives/marquee-if-overflow.directive';
import { StopNameComponent } from '../../../shared/stop-name/stop-name.component';
import { DRAWER_CONSTANTS } from '../../../core/utils/drawer.constants';
import { getVisibleHeight } from '../../../core/utils/utils';

/**
 * DrawerComponent is the central navigation surface for both mobile and desktop views.
 * Rather than build a bespoke desktop UX, we reuse the drawer content while changing how it is positioned.
 * Layout measurements are streamed to MapLayoutService so the map can reposition controls intelligently.
 */
@Component({
  selector: 'drawer',
  standalone: true,
  imports: [
    CommonModule,
    BottomMenuComponent,
    StopComponent,
    FvoritesComponent,
    HomeComponent,
    MarqueeIfOverflowDirective,
    StopNameComponent,
  ],
  templateUrl: './drawer.component.html',
  // TODO(question): STYLING_GUIDE.MD referenced in the brief is not present; continuing with current visual direction.
  styles: [
    `
      ::ng-deep .drawer-content .stop-name-component {
        width: 100%;
        padding: 0 0.5rem;
        box-sizing: border-box;
      }

      ::ng-deep .drawer-content input {
        max-width: 100%;
        box-sizing: border-box;
      }
    `,
  ],
})
export class DrawerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('drawerContainer', { static: true }) drawerContainer?: ElementRef<HTMLDivElement>;

  private readonly store = inject(Store);
  private readonly mapLayoutService = inject(MapLayoutService);

  private readonly destroy$ = new Subject<void>();
  private readonly dragActive$ = new BehaviorSubject<boolean>(false);
  private resizeObserver?: ResizeObserver;
  private isMobileSnapshot = false;
  private viewInitialized = false;

  stops$ = this.store.select(selectAllStops);
  loading$ = this.store.select(selectStopsLoading);
  drawerMode$ = this.store.select(selectDrawerMode);
  selectedStop$ = this.store.select(selectSelectedStop);
  drawerExpanded$ = this.store.select(selectDrawerExpanded);
  isMobile$ = this.store.select(selectIsMobile);

  DrawerMode = DrawerMode;
  readonly DRAWER_CONSTANTS = DRAWER_CONSTANTS;

  headerTitles = {
    [DrawerMode.Home]: 'Home',
    [DrawerMode.Favorites]: 'Favorites',
  } as const;

  /**
   * Container classes adapt between mobile overlay and desktop side-rail layouts without duplicating markup.
   */
  drawerContainerClasses$ = combineLatest([this.isMobile$, this.drawerExpanded$]).pipe(
    map(([isMobile, expanded]) => {
      if (isMobile) {
        const baseOverlay =
          'fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-700 shadow-lg transition-transform duration-200 z-[1000]';
        const safeAreaPadding = 'pb-[env(safe-area-inset-bottom)]';
        const translateState = expanded ? 'translate-y-0' : 'translate-y-[60%]';
        return `${baseOverlay} ${safeAreaPadding} ${translateState}`;
      }

      return [
        'relative',
        'flex',
        'h-full',
        'w-full',
        'bg-gray-900/95',
        'border',
        'border-gray-700/60',
        'shadow-[0_20px_60px_rgba(0,0,0,0.45)]',
        'rounded-3xl',
        'overflow-hidden',
        'backdrop-blur-xl',
        'transition-all',
        'duration-300',
        'pointer-events-auto',
      ].join(' ');
    })
  );

  // Drag state is mobile-only but stored on the instance so we can short-circuit map updates mid-gesture.
  private isDragging = false;
  private startY = 0;
  private currentTranslateY = 0;
  private initialTranslateY = 0;

  toggleDrawer() {
    this.store.dispatch(toggleDrawerExpanded({}));
  }

  ngOnInit() {
    // Clear stale inline transforms in case the component is recreated from a cached route state.
    this.ensureCleanState();

    // Track breakpoint changes to emit fresh metrics even if the drawer itself does not resize.
    this.isMobile$.pipe(takeUntil(this.destroy$)).subscribe((isMobile) => {
      this.isMobileSnapshot = !!isMobile;

      if (this.viewInitialized) {
        this.scheduleMetricsUpdate(0);
      }
    });
  }

  ngAfterViewInit() {
    this.viewInitialized = true;

    this.resizeObserver = new ResizeObserver(() => {
      // The drawer animates frequently; debounce to avoid spamming the map listener.
      this.scheduleMetricsUpdate(100);
    });

    this.drawerExpanded$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      // Allow CSS transition (~300ms) to finish so measurements reflect the final state.
      this.scheduleMetricsUpdate(350);
    });

    const element = this.drawerContainer?.nativeElement;
    if (element) {
      this.resizeObserver.observe(element);
      this.scheduleMetricsUpdate(100);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.resizeObserver?.disconnect();

    // Reset map offsets so there is no lingering padding when navigating away.
    this.mapLayoutService.resetDrawerMetrics();
  }

  onTouchStart(event: TouchEvent) {
    const element = this.drawerContainer?.nativeElement;
    if (!element) return;

    this.isDragging = true;
    this.dragActive$.next(true);
    this.startY = event.touches[0].clientY;

    this.drawerExpanded$.pipe(take(1)).subscribe((expanded) => {
      this.initialTranslateY = expanded
        ? 0
        : window.innerHeight * (DRAWER_CONSTANTS.MOBILE.CLOSED_TRANSLATE_PERCENTAGE / 100);
      this.currentTranslateY = this.initialTranslateY;
    });

    element.style.transition = 'none';
  }

  onTouchMove(event: TouchEvent) {
    const element = this.drawerContainer?.nativeElement;
    if (!this.isDragging || !element) return;

    event.preventDefault();
    const currentY = event.touches[0].clientY;
    const deltaY = currentY - this.startY;

    const maxTranslateY = window.innerHeight * (DRAWER_CONSTANTS.MOBILE.CLOSED_TRANSLATE_PERCENTAGE / 100);
    const newTranslateY = Math.max(0, Math.min(this.initialTranslateY + deltaY, maxTranslateY));
    this.currentTranslateY = newTranslateY;

    element.style.transform = `translateY(${newTranslateY}px)`;
  }

  onTouchEnd() {
    const element = this.drawerContainer?.nativeElement;
    if (!this.isDragging || !element) return;

    this.isDragging = false;
    this.dragActive$.next(false);

    const threshold = window.innerHeight * (DRAWER_CONSTANTS.MOBILE.GESTURE_THRESHOLD_PERCENTAGE / 100);
    const shouldExpand = this.currentTranslateY < threshold;

    this.drawerExpanded$.pipe(take(1)).subscribe((expanded) => {
      if (shouldExpand !== expanded) {
        this.store.dispatch(toggleDrawerExpanded({}));
      }

      element.style.transition = '';
      element.style.transform = '';

      this.scheduleMetricsUpdate(50);
    });
  }

  /**
   * Emit drawer measurements so the map can reposition its viewport and controls.
   */
  private updateDrawerMetrics() {
    if (this.dragActive$.value) return; // Gestures provide unreliable measurements; skip until settled.

    const element = this.drawerContainer?.nativeElement;
    if (!element) return;

    const visibleHeight = getVisibleHeight(element);
    const rect = element.getBoundingClientRect();

    this.mapLayoutService.updateDrawerMetrics({
      height: visibleHeight,
      width: rect.width,
      anchor: this.isMobileSnapshot ? 'bottom' : 'right',
      offsetBottom: Math.max(0, window.innerHeight - rect.bottom),
      offsetRight: Math.max(0, window.innerWidth - rect.right),
    });
  }

  private scheduleMetricsUpdate(delayMs: number) {
    timer(delayMs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateDrawerMetrics());
  }

  private ensureCleanState() {
    const element = this.drawerContainer?.nativeElement;
    if (!element) return;

    element.style.transform = '';
    element.style.transition = '';

    this.isDragging = false;
    this.currentTranslateY = 0;
    this.initialTranslateY = 0;
  }
}
