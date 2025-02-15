import { Component, inject } from '@angular/core';
import { MapComponent } from './map/map.component';
import { CommonModule } from '@angular/common';
import { DrawerComponent } from './drawer/drawer.component';
import { Store } from '@ngrx/store';
import { selectIsMobile } from '../../core/state/lib/layout/layout.selectors';

@Component({
  standalone: true,
  templateUrl: './main.component.html',
  imports: [MapComponent, CommonModule, DrawerComponent],
})
export class MainComponent {
  private store = inject(Store);
  isMobile$ = this.store.select(selectIsMobile);
}
