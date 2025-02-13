import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { combineLatest, map, Observable, timer } from 'rxjs';
import { DrawerMode, SelectedStop, Stop } from '../../../core/utils/global.types';
import { select, Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { BottomMenuComponent } from '../bottom-menu/bottom-menu.component';
import { selectAllStops, selectStopsLoading } from '../../../core/state/lib/stops/stops.selectors';
import {
  selectDrawerExpanded,
  selectDrawerMode,
  selectSelectedStop,
} from '../../../core/state/lib/user/user.selectors';
import { toggleDrawerExpanded } from '../../../core/state/lib/user/user.actions';
import { MapLayoutService } from '../../../core/services/map-layout.service';
import { StopsComponent } from './stops/stops.component';
import { FvoritesComponent } from './favorites/favorites.components';
import { getVisibleHeight } from '../../../core/utils/utils';

@Component({
  selector: 'drawer',
  templateUrl: './drawer.component.html',
  standalone: true,
  imports: [CommonModule, BottomMenuComponent, StopsComponent, FvoritesComponent],
})
export class DrawerComponent implements OnInit {
  @ViewChild('drawerContainer') drawerContainer!: ElementRef;
  stops$: Observable<Stop[]>;
  selectedStop$: Observable<SelectedStop>;
  loading$: Observable<boolean>;
  drawerMode$: Observable<DrawerMode>;
  drawerExpanded$: Observable<boolean>;
  DrawerMode = DrawerMode;
  headerTitles = {
    [DrawerMode.Stops]: 'Stops',
    [DrawerMode.Favorites]: 'Favorites',
  };
  headerTitle$: Observable<string> | undefined;

  private resizeObserver!: ResizeObserver;

  constructor(private store: Store, private mapLayoutService: MapLayoutService) {
    this.stops$ = this.store.select(selectAllStops);
    this.loading$ = this.store.select(selectStopsLoading);
    this.drawerMode$ = this.store.select(selectDrawerMode);
    this.selectedStop$ = this.store.select(selectSelectedStop);
    this.drawerExpanded$ = this.store.select(selectDrawerExpanded);
  }

  toggleDrawer() {
    this.store.dispatch(toggleDrawerExpanded({}));
  }

  ngAfterViewInit() {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        this.updateHeight();
      }
    });

    this.drawerExpanded$.subscribe(() => {
      timer(300).subscribe(() => this.updateHeight()); // Add delay to account for animation
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
    this.headerTitle$ = combineLatest([this.drawerMode$, this.selectedStop$]).pipe(
      map(([drawerMode, selectedStop]) =>
        selectedStop && selectedStop.stopName ? selectedStop.stopName : this.headerTitles[drawerMode]
      )
    );
  }

  ngOnDestory() {
    this.resizeObserver.disconnect();
  }
}
