import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehicle } from '../../../core/utils/global.types';
import { Store } from '@ngrx/store';
import {
  selectAllVehicles,
  selectVehiclesLoading,
} from '../../../core/state/lib/vehicles/vehicles.selectors';
import { CommonModule } from '@angular/common';
import { BottomMenuComponent } from '../bottom-menu/bottom-menu.component';

@Component({
  selector: 'drawer',
  templateUrl: './drawer.component.html',
  standalone: true,
  imports: [CommonModule, BottomMenuComponent],
})
export class DrawerComponent implements OnInit {
  isExpanded = false;
  vehicles$: Observable<Vehicle[]>;
  loading$: Observable<boolean>;

  constructor(private store: Store) {
    this.vehicles$ = this.store.select(selectAllVehicles);
    this.loading$ = this.store.select(selectVehiclesLoading);
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
