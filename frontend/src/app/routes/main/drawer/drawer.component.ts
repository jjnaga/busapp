import { Component, ElementRef, inject, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { combineLatest, map, Observable, timer } from 'rxjs';
import { DrawerMode } from '../../../core/utils/global.types';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { BottomMenuComponent } from '../bottom-menu/bottom-menu.component';
import { selectAllStops, selectSelectedStop, selectStopsLoading } from '../../../core/state/lib/stops/stops.selectors';
import { selectDrawerExpanded, selectDrawerMode } from '../../../core/state/lib/user/user.selectors';
import { toggleDrawerExpanded } from '../../../core/state/lib/user/user.actions';
import { MapLayoutService } from '../../../core/services/maps/map-layout.service';
import { StopsComponent } from './stops/stops.component';
import { FvoritesComponent } from './favorites/favorites.components';
import { getVisibleHeight } from '../../../core/utils/utils';
import { selectIsMobile } from '../../../core/state/lib/layout/layout.selectors';
import { MarqueeIfOverflowDirective } from '../../../core/utils/directives/marquee-if-overflow.directive';
import { StopNameComponent } from '../../../shared/stop-name/stop-name.component';

@Component({
  selector: 'drawer',
  templateUrl: './drawer.component.html',
  standalone: true,
  imports: [
    CommonModule,
    BottomMenuComponent,
    StopsComponent,
    FvoritesComponent,
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
    [DrawerMode.Stops]: 'Nearby Stops',
    [DrawerMode.Favorites]: 'Favorites',
  };

  // Compute container class based on platform: mobile gets slide transform; desktop is fixed.
  drawerContainerClasses$: Observable<string> = combineLatest([this.isMobile$, this.drawerExpanded$]).pipe(
    map(([isMobile, expanded]) => {
      if (isMobile) {
        // Mobile: full-width bottom drawer with slide animation.
        return `absolute bottom-0 left-0 w-full bg-white border-t shadow-lg transition-transform duration-200 ${
          expanded ? 'translate-y-0' : 'translate-y-[60%]'
        }`;
      } else {
        // Desktop: Fixed floating drawer simulating a 375x575 iPhone screen.
        return `absolute left-10 top-10 bg-white border shadow-lg w-[375px] h-[575px]`;
      }
    })
  );

  private resizeObserver!: ResizeObserver;

  // This toggle is only used on mobile (the button is hidden on desktop).
  toggleDrawer() {
    this.store.dispatch(toggleDrawerExpanded({}));
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
