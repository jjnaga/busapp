import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectDrawerExpanded } from '../../../../core/state/lib/user/user.selectors';
import { selectAllFavorites } from '../../../../core/state/lib/favorites/favorites.selectors';
import { Stop } from '../../../../core/utils/global.types';
import { toggleFavoriteAction } from '../../../../core/state/lib/favorites/favorites.actions';
import { setSelectedStop } from '../../../../core/state/lib/user/user.actions';

@Component({
  selector: 'drawer-favorites',
  templateUrl: './favorites.component.html',
  imports: [CommonModule],
  standalone: true,
})
export class FvoritesComponent {
  private store = inject(Store);

  drawerExpanded$ = this.store.select(selectDrawerExpanded);
  favorites$ = this.store.select(selectAllFavorites);

  toggleFavorite(stop: Stop) {
    if (!stop) {
      console.error('toggleFavorites: stop is undefined');
      return;
    }

    this.store.dispatch(toggleFavoriteAction({ stop }));
  }

  setSelectedStop(stop: Stop) {
    this.store.dispatch(setSelectedStop({ stop }));
  }
}
