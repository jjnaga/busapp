import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouteService } from '../../core/services/routes.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faStar,
  faSearch,
  faXmark,
  faBell,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import {
  FavoritesViewModel,
  sideBarModes,
} from '../../core/utils/global.types';
import { combineLatest, map, Observable, Subscription, tap } from 'rxjs';
import { UserDataService } from '../../core/services/user-data.service';
import { StopsSidebarComponent } from './sidebar/stops/stops-sidebar.component';
import { FavoritesSidebarComponent } from './sidebar/favorites/favorites-sidebar.component';
import { VehiclesService } from '../../core/services/vehicles.service';
import { SubscriptionsSidebarComponent } from './sidebar/subscriptions/subscriptions-sidebar.component';
import { VersionService } from '../../core/services/version.service';

@Component({
  selector: 'header-component',
  imports: [
    FontAwesomeModule,
    FormsModule,
    CommonModule,
    StopsSidebarComponent,
    FavoritesSidebarComponent,
    SubscriptionsSidebarComponent,
  ],
  templateUrl: './header.component.html',
  standalone: true,
})
export class HeaderComponent implements OnInit {
  links: { path: string; label: string }[] = [];
  faStar = faStar;
  faSearch = faSearch;
  faXmark = faXmark;
  faBell = faBell;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  showSidebar: boolean = false;
  sidebarMode: sideBarModes = null;
  trackedVehicle$ = this.vehiclesService.trackedVehicle$;
  version: string = '';

  favoritesViewModel$: Observable<FavoritesViewModel> | undefined;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private routeService: RouteService,
    public userDataService: UserDataService,
    public vehiclesService: VehiclesService,
    private versionService: VersionService
  ) {}

  ngOnInit(): void {
    const routes = this.routeService.getRoutes();
    this.subscribeToData();
    this.version = this.versionService.getAppVersion();
  }

  private subscribeToData() {
    this.subscriptions.add(
      this.userDataService.showSidebar$.subscribe(
        (sidebar) => (this.showSidebar = sidebar)
      )
    );

    this.subscriptions.add(
      this.userDataService.sidebarMode$.subscribe(
        (sidebarMode) => (this.sidebarMode = sidebarMode)
      )
    );

    // Favorites In View variables
    this.favoritesViewModel$ = combineLatest([
      this.userDataService.favoritesNearby$,
      this.userDataService.favoritesNearbyIndex$,
    ]).pipe(
      map(([favoritesNearby, favoriteInViewIndex]) => ({
        favoritesNearby,
        favoriteInViewIndex,
      }))
    );
  }

  toggleMode = (mode: sideBarModes) => {
    this.userDataService.setSidebarMode(mode);
  };

  onXmarkClick = () => {
    this.userDataService.resetSidebar();
  };

  setFavoritesNearbyIndex() {
    const favoritesNearbyIndex = this.userDataService.getfavoritesNearbyIndex();

    if (favoritesNearbyIndex === null) {
      this.userDataService.setfavoritesNearbyIndex(0);
    }
  }
}
