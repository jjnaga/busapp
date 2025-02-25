import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faCog, faStar, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { DrawerMode } from '../../../core/utils/global.types';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectDrawerMode } from '../../../core/state/lib/user/user.selectors';
import { setDrawerMode } from '../../../core/state/lib/user/user.actions';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'bottom-menu',
  templateUrl: './bottom-menu.component.html',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
})
export class BottomMenuComponent {
  DrawerMode = DrawerMode;
  faStar = faStar;
  faMapMarkerAlt = faMapMarkerAlt;
  faCog = faCog;
  faBell = faBell;
  drawerMode$: Observable<DrawerMode>;

  constructor(private store: Store) {
    this.drawerMode$ = this.store.select(selectDrawerMode);
  }

  setDrawerMode(mode: DrawerMode) {
    this.store.dispatch(setDrawerMode({ drawerMode: mode }));
  }
}
