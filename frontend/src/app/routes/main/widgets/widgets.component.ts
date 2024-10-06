import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackedBusComponent } from './tracked-bus/tracked-bus.component';
import { FavoritesComponent } from './favorites/favorites.component';

@Component({
  selector: 'widgets-component',
  imports: [CommonModule, TrackedBusComponent, FavoritesComponent],
  templateUrl: './widgets.component.html',
  standalone: true,
})
export class WidgetsComponent {
  constructor() {}
}
