import { Component, ElementRef, inject, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { combineLatest, map, Observable, timer, take } from 'rxjs';
import { DrawerMode } from '../../../core/utils/global.types';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { BottomMenuComponent } from '../bottom-menu/bottom-menu.component';
import { selectAllStops, selectSelectedStop, selectStopsLoading } from '../../../core/state/lib/stops/stops.selectors';
import { selectDrawerExpanded, selectDrawerMode } from '../../../core/state/lib/user/user.selectors';
import { toggleDrawerExpanded } from '../../../core/state/lib/user/user.actions';
import { MapLayoutService } from '../../../core/services/maps/map-layout.service';
import { StopComponent } from './stop/stop.component';
import { FvoritesComponent } from './favorites/favorites.components';
import { HomeComponent } from './home/home.component';
import { getVisibleHeight } from '../../../core/utils/utils';
import { selectIsMobile } from '../../../core/state/lib/layout/layout.selectors';
import { MarqueeIfOverflowDirective } from '../../../core/utils/directives/marquee-if-overflow.directive';
import { StopNameComponent } from '../../../shared/stop-name/stop-name.component';
import { DRAWER_CONSTANTS } from '../../../core/utils/drawer.constants';

@Component({
  selector: 'drawer',
  templateUrl: './drawer.component.html',
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
  // wtf did 3.7 generate
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
  @ViewChild('drawerContainer') drawerContainer!: ElementRef;

  private store = inject(Store);
  private mapLayoutService = inject(MapLayoutService);

  stops$ = this.store.select(selectAllStops);
  loading$ = this.store.select(selectStopsLoading);
  drawerMode$ = this.store.select(selectDrawerMode);
  selectedStop$ = this.store.select(selectSelectedStop);
  drawerExpanded$ = this.store.select(selectDrawerExpanded);
  isMobile$ = this.store.select(selectIsMobile);

  DrawerMode = DrawerMode;
  headerTitles = {
    [DrawerMode.Home]: 'Home',
    [DrawerMode.Favorites]: 'Favorites',
  };

  // Drawer configuration constants
  readonly DRAWER_CONSTANTS = DRAWER_CONSTANTS;

  // Touch/drag state
  private isDragging = false;
  private startY = 0;
  private currentTranslateY = 0;
  private initialTranslateY = 0;

  // Compute container class based on platform: mobile gets slide transform; desktop is fixed.
  drawerContainerClasses$: Observable<string> = combineLatest([this.isMobile$, this.drawerExpanded$]).pipe(
    map(([isMobile, expanded]) => {
      if (isMobile) {
        // Mobile: full-width bottom drawer with slide animation.
        const baseClasses =
          'absolute bottom-0 left-0 w-full bg-white border-t shadow-lg transition-transform duration-200';
        const transformClass = expanded
          ? 'translate-y-0'
          : `translate-y-[${DRAWER_CONSTANTS.MOBILE.CLOSED_TRANSLATE_PERCENTAGE}%]`;
        return `${baseClasses} ${transformClass}`;
      } else {
        // Desktop: Fixed floating drawer simulating iPhone screen dimensions.
        const { WIDTH_PX, HEIGHT_PX } = DRAWER_CONSTANTS.DESKTOP;
        return `absolute left-10 top-10 bg-white border shadow-lg w-[${WIDTH_PX}px] h-[${HEIGHT_PX}px]`;
      }
    })
  );

  private resizeObserver!: ResizeObserver;

  // This toggle is only used on mobile (the button is hidden on desktop).
  toggleDrawer() {
    this.store.dispatch(toggleDrawerExpanded({}));
  }

  // Touch event handlers for drag functionality
  onTouchStart(event: TouchEvent) {
    if (!this.drawerContainer?.nativeElement) return;

    this.isDragging = true;
    this.startY = event.touches[0].clientY;

    // Get current transform value
    const computedStyle = window.getComputedStyle(this.drawerContainer.nativeElement);
    const transform = computedStyle.transform;
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(transform);
      this.currentTranslateY = matrix.m42; // translateY value
    } else {
      this.currentTranslateY = 0;
    }
    this.initialTranslateY = this.currentTranslateY;

    // Disable transition during drag
    this.drawerContainer.nativeElement.style.transition = 'none';
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging || !this.drawerContainer?.nativeElement) return;

    event.preventDefault();
    const currentY = event.touches[0].clientY;
    const deltaY = currentY - this.startY;

    // Calculate new translateY, constrain it to reasonable bounds
    const maxTranslateY = window.innerHeight * (DRAWER_CONSTANTS.MOBILE.CLOSED_TRANSLATE_PERCENTAGE / 100);
    const newTranslateY = Math.max(-50, Math.min(this.initialTranslateY + deltaY, maxTranslateY));
    this.currentTranslateY = newTranslateY;

    // Apply transform directly
    this.drawerContainer.nativeElement.style.transform = `translateY(${newTranslateY}px)`;
  }

  onTouchEnd(event: TouchEvent) {
    if (!this.isDragging || !this.drawerContainer?.nativeElement) return;

    this.isDragging = false;

    // Re-enable transition
    this.drawerContainer.nativeElement.style.transition = '';

    // Determine final position based on drag distance
    const threshold = window.innerHeight * (DRAWER_CONSTANTS.MOBILE.GESTURE_THRESHOLD_PERCENTAGE / 100);
    const shouldExpand = this.currentTranslateY < threshold;

    // Get current state and update if needed
    this.drawerExpanded$.pipe(take(1)).subscribe((expanded) => {
      if (shouldExpand && !expanded) {
        this.store.dispatch(toggleDrawerExpanded({}));
      } else if (!shouldExpand && expanded) {
        this.store.dispatch(toggleDrawerExpanded({}));
      }
    });

    // Reset transform to let CSS classes take over
    this.drawerContainer.nativeElement.style.transform = '';
  }

  ngAfterViewInit() {
    this.resizeObserver = new ResizeObserver(() => {
      this.updateHeight();
    });

    // Update height after animation changes (only relevant on mobile).
    this.drawerExpanded$.subscribe(() => {
      timer(300).subscribe(() => this.updateHeight());
    });

    if (this.drawerContainer?.nativeElement) {
      this.resizeObserver.observe(this.drawerContainer.nativeElement);
    }
  }

  private updateHeight() {
    if (this.drawerContainer?.nativeElement) {
      const visibleHeight = getVisibleHeight(this.drawerContainer.nativeElement);
      this.mapLayoutService.updateDrawerHeight(visibleHeight);
    }
  }

  ngOnInit(): void {
    // Remove the headerTitle$ initialization
    // The title is now handled directly in the template
  }

  ngOnDestroy() {
    this.resizeObserver.disconnect();
  }
}
