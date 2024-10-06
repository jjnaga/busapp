import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouteService } from '../../core/services/routes.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar, faBell } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import {
  FavoritesViewModel,
  sideBarModes,
} from '../../core/utils/global.types';
import { combineLatest, map, Observable, Subscription, tap } from 'rxjs';
import { UserDataService } from '../../core/services/user-data.service';
import { VehiclesService } from '../../core/services/vehicles.service';
import { VersionService } from '../../core/services/version.service';

@Component({
  selector: 'header-component',
  imports: [FontAwesomeModule, FormsModule, CommonModule],
  templateUrl: './header.component.html',
  standalone: true,
})
export class HeaderComponent implements OnInit {
  links: { path: string; label: string }[] = [];
  faStar = faStar;
  faBell = faBell;
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
  }

  toggleMode = (mode: sideBarModes) => {
    this.userDataService.setSidebarMode(mode);
  };

  onXmarkClick = () => {
    this.userDataService.resetSidebar();
  };
}
