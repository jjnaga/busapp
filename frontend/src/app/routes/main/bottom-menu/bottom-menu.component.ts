import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'bottom-menu',
  templateUrl: './bottom-menu.component.html',
  standalone: true,
  imports: [FontAwesomeModule],
})
export class BottomMenuComponent {
  faStar = faStar;

  constructor() {}
}
