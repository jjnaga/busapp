import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouteService } from '../../core/services/routes.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar, faSearch } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'header-component',
  imports: [FontAwesomeModule, FormsModule, CommonModule],
  templateUrl: './header.component.html',
  standalone: true,
})
export class HeaderComponent implements OnInit {
  links: { path: string; label: string }[] = [];
  faStar = faStar;
  faSearch = faSearch;
  searchResult: string = '';
  showSidebar: boolean = false;

  constructor(private routeService: RouteService) {}

  ngOnInit(): void {
    const routes = this.routeService.getRoutes();
    this.links = routes.map((route) => ({
      path: route.path || '',
      label: route.path
        ? route.path.charAt(0).toUpperCase() + route.path.slice(1)
        : 'Home',
    }));
  }

  onSearch() {
    console.log('typed: ', this.searchResult);
    this.showSidebar = this.searchResult.length > 0;
  }
}
