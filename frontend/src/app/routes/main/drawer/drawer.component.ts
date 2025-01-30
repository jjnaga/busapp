import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Stop, Vehicle } from '../../../core/utils/global.types';
import { Store } from '@ngrx/store';
import {
  selectAllVehicles,
  selectVehiclesLoading,
} from '../../../core/state/lib/vehicles/vehicles.selectors';
import { CommonModule } from '@angular/common';
import { BottomMenuComponent } from '../bottom-menu/bottom-menu.component';
import {
  selectAllStops,
  selectStopsLoading,
} from '../../../core/state/lib/stops/stops.selectors';

@Component({
  selector: 'drawer',
  templateUrl: './drawer.component.html',
  standalone: true,
  imports: [CommonModule, BottomMenuComponent],
})
export class DrawerComponent implements OnInit {
  isExpanded = false;
  stops$: Observable<Stop[]>;
  loading$: Observable<boolean>;

  constructor(private store: Store) {
    this.stops$ = this.store.select(selectAllStops);
    this.loading$ = this.store.select(selectStopsLoading);
  }

  toggleDrawer() {
    this.isExpanded = !this.isExpanded;
  }

  ngOnInit(): void {
    this.loading$.subscribe((loading) => {
      console.log(loading);
    });
  }
}
