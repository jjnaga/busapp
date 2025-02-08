import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectDrawerExpanded } from '../../../../core/state/lib/user/user.selectors';
import { Observable } from 'rxjs';
import { Stop } from '../../../../core/utils/global.types';
import { selectAllStops, selectStopsLoading } from '../../../../core/state/lib/stops/stops.selectors';

@Component({
  selector: 'drawer-favorites',
  templateUrl: './favorites.component.html',
  imports: [CommonModule],
  standalone: true,
})
export class FvoritesComponent {
  drawerExpanded$ = this.store.select(selectDrawerExpanded);
  stops$: Observable<Stop[]>;
  stopsLoading$: Observable<boolean>;

  constructor(private store: Store) {
    this.stops$ = this.store.select(selectAllStops);
    this.stopsLoading$ = this.store.select(selectStopsLoading);
    this.drawerExpanded$ = this.store.select(selectDrawerExpanded);
  }
}
