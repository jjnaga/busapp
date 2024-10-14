import { Component, OnInit } from '@angular/core';
import { UserDataService } from '../../../core/services/user-data.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faSearch,
  faXmark,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { StopsSidebarComponent } from './stops/stops-sidebar.component';
import { FavoritesSidebarComponent } from './favorites/favorites-sidebar.component';
import { SubscriptionsSidebarComponent } from './subscriptions/subscriptions-sidebar.component';
import { tap } from 'rxjs';

@Component({
  selector: 'menu-component',
  templateUrl: './menu.component.html',
  imports: [
    FontAwesomeModule,
    CommonModule,
    StopsSidebarComponent,
    FavoritesSidebarComponent,
    SubscriptionsSidebarComponent,
  ],
  standalone: true,
})
export class MenuComponent {
  faSearch = faSearch;
  faXmark = faXmark;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  sidebarMode$ = this.userDataService.sidebarMode$.pipe(
    tap((data) => console.log(data))
  );

  constructor(private userDataService: UserDataService) {}

  resetSidebar(): void {
    this.userDataService.resetSidebar();
  }
}
