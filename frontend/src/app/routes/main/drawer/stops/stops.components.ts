import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectDrawerExpanded, selectSelectedStop } from '../../../../core/state/lib/user/user.selectors';
import { Observable } from 'rxjs';
import { DetailedStop, SelectedStop, Stop } from '../../../../core/utils/global.types';
import { selectAllStops, selectStopsLoading } from '../../../../core/state/lib/stops/stops.selectors';
import { setSelectedStop } from '../../../../core/state/lib/user/user.actions';
import { DiffMinutesPipe } from '../../../../core/utils/pipes/diff-minutes.pipe';

@Component({
  selector: 'drawer-stops',
  templateUrl: './stops.component.html',
  imports: [CommonModule, DiffMinutesPipe],
  standalone: true,
})
export class StopsComponent {
  drawerExpanded$ = this.store.select(selectDrawerExpanded);
  stops$: Observable<Stop[]>;
  stopsLoading$: Observable<boolean>;
  selectedStop$: Observable<SelectedStop>;

  setSelectedStop(stop: Stop) {
    this.store.dispatch(setSelectedStop({ stop }));
  }

  // In your component (e.g., StopsComponent)
  isDetailedStop(stop: SelectedStop): stop is DetailedStop {
    return stop !== null && 'lastUpdated' in stop;
  }

  constructor(private store: Store) {
    this.stops$ = this.store.select(selectAllStops);
    this.stopsLoading$ = this.store.select(selectStopsLoading);
    this.drawerExpanded$ = this.store.select(selectDrawerExpanded);
    this.selectedStop$ = this.store.select(selectSelectedStop);
  }
}
