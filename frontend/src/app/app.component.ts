import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { appInit } from './core/state/root.actions';
import { setMobileMode } from './core/state/lib/layout/layout.actions';
import { AppRefreshService } from './core/services/app-refresh.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor(private store: Store, private appRefreshService: AppRefreshService) {}

  ngOnInit() {
    this.store.dispatch(appInit());

    this.appRefreshService.initialize();

    // Implement size
    this.onResize();
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    const isMobile = window.innerWidth < 768;
    this.store.dispatch(setMobileMode({ isMobile }));
  }

  title = 'Busapp';
}
