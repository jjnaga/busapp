import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar, faBell } from '@fortawesome/free-solid-svg-icons';
import { sideBarModes } from '../../core/utils/global.types';
import { UserDataService } from '../../core/services/user-data.service';

@Component({
  selector: 'header-component',
  imports: [FontAwesomeModule],
  templateUrl: './header.component.html',
  standalone: true,
})
export class HeaderComponent {
  faStar = faStar;
  faBell = faBell;
  version: string = '';

  constructor(public userDataService: UserDataService) {}

  toggleMode = (mode: sideBarModes) => {
    this.userDataService.setSidebarMode(mode);
  };
}
