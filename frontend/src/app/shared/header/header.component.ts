import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouteService } from '../../core/services/routes.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar, faSearch, faXmark } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { sideBarModes } from '../../core/models/global.model';
import { Subscription } from 'rxjs';
import { UserDataService } from '../../core/services/user-data.service';
import { StopsSidebarComponent } from './sidebar/stops/stops-sidebar.component';
import { FavoritesSidebarComponent } from './sidebar/favorites/favorites-sidebar.component';

@Component({
  selector: 'header-component',
  imports: [
    FontAwesomeModule,
    FormsModule,
    CommonModule,
    StopsSidebarComponent,
    FavoritesSidebarComponent,
  ],
  templateUrl: './header.component.html',
  standalone: true,
})
export class HeaderComponent implements OnInit {
  links: { path: string; label: string }[] = [];
  faStar = faStar;
  faSearch = faSearch;
  faXmark = faXmark;
  searchResult: string = '';
  showSidebar: boolean = false;
  sidebarMode: sideBarModes = null;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private routeService: RouteService,
    private userDataService: UserDataService
  ) {}

  ngOnInit(): void {
    const routes = this.routeService.getRoutes();

    this.subscriptions.add(
      this.userDataService.searchResult$.subscribe(
        (result) => (this.searchResult = result)
      )
    );

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

  onSearchResultChange() {
    this.userDataService.setSearchResult(this.searchResult);
  }

  toggleMode = (mode: sideBarModes) => {
    this.userDataService.setSidebarMode(mode);
    this.userDataService.updateShowSidebar();
  };

  onXmarkClick = () => {
    this.userDataService.resetSidebar();
  };
}
