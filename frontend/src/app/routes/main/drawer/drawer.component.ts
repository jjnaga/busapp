import { Component, OnInit } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
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
import { StopsComponent } from './stops/stops.components';
import { FvoritesComponent } from './favorites/favorites.components';

@Component({
  selector: 'drawer',
  templateUrl: './drawer.component.html',
  standalone: true,
  imports: [CommonModule, BottomMenuComponent, StopsComponent, FvoritesComponent],
})
export class DrawerComponent implements OnInit {
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

  constructor(private store: Store) {
    this.stops$ = this.store.select(selectAllStops);
    this.loading$ = this.store.select(selectStopsLoading);
    this.drawerMode$ = this.store.select(selectDrawerMode);
    this.selectedStop$ = this.store.select(selectSelectedStop);
    this.drawerExpanded$ = this.store.select(selectDrawerExpanded);
  }

  toggleDrawer() {
    this.store.dispatch(toggleDrawerExpanded({}));
  }

  ngOnInit(): void {
    this.loading$.subscribe((loading) => {
      console.log(loading);
    });

    this.headerTitle$ = combineLatest([this.drawerMode$, this.selectedStop$]).pipe(
      map(([drawerMode, selectedStop]) =>
        selectedStop && selectedStop.stopName ? selectedStop.stopName : this.headerTitles[drawerMode],
      ),
    );
  }
}
