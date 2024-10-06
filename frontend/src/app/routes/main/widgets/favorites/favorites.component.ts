import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import { UserDataService } from '../../../../core/services/user-data.service';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'favorites-component',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule],
  templateUrl: './favorites.component.html',
})
export class FavoritesComponent {
  faStar = faStar;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  favoritesData$ = combineLatest([
    this.userDataService.favoritesNearby$,
    this.userDataService.favoritesNearbyIndex$,
  ]).pipe(
    map(([favoritesNearby, favoriteInViewIndex]) => ({
      favoritesNearby,
      favoriteInViewIndex,
    }))
  );

  constructor(private userDataService: UserDataService) {}

  decrementfavoritesNearbyIndex(): void {
    this.userDataService.decrementfavoritesNearbyIndex();
  }

  incrementfavoritesNearbyIndex(): void {
    this.userDataService.incrementfavoritesNearbyIndex();
  }

  setFavoritesNearbyIndex() {
    const favoritesNearbyIndex = this.userDataService.getfavoritesNearbyIndex();

    if (favoritesNearbyIndex === null) {
      this.userDataService.setfavoritesNearbyIndex(0);
    }
  }
}
