import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { appInit } from './core/state/root.actions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  constructor(private store: Store) {}

  ngOnInit() {
    this.store.dispatch(appInit());
  }

  title = 'Busapp';
}
