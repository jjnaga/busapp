import { Component, OnInit } from '@angular/core';
import { RouteService } from '../../core/services/routes.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {
  links: { path: string; label: string }[] = [];

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
}
