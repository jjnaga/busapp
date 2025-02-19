import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectDrawerExpanded } from '../../../../core/state/lib/user/user.selectors';
import { selectFavoritesWithLiveData } from '../../../../core/state/lib/favorites/favorites.selectors';
import { Stop } from '../../../../core/utils/global.types';
import { toggleFavoriteAction } from '../../../../core/state/lib/favorites/favorites.actions';
import { setSelectedStop } from '../../../../core/state/lib/user/user.actions';
import { faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { tap } from 'rxjs';

import { DiffMinutesPipe } from '../../../../core/utils/pipes/diff-minutes.pipe';

@Component({
  selector: 'drawer-favorites',
  templateUrl: './favorites.component.html',
  imports: [CommonModule, FontAwesomeModule, DiffMinutesPipe],
  standalone: true,
})
export class FvoritesComponent {
  private store = inject(Store);

  drawerExpanded$ = this.store.select(selectDrawerExpanded);
  faX = faX;
  selectFavoritesWithLiveData$ = this.store
    .select(selectFavoritesWithLiveData)
    .pipe(tap((data) => console.log('this aint working', data)));

  toggleFavorite(stop?: Stop) {
    if (stop === undefined) {
      return;
    }

    this.store.dispatch(toggleFavoriteAction({ stop }));
  }

  setSelectedStop(stop?: Stop) {
    if (stop === undefined) {
      return;
    }

    this.store.dispatch(setSelectedStop({ stop }));
  }
}
