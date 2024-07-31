import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'subscribe-menu',
  imports: [CommonModule, FormsModule],
  templateUrl: './subscribe-menu.component.html',
  standalone: true,
})
export class SubscribeComponent {
  days = [
    { value: 'sun', label: 'Sun', selected: false },
    { value: 'mon', label: 'Mon', selected: false },
    { value: 'tue', label: 'Tue', selected: false },
    { value: 'wed', label: 'Wed', selected: false },
    { value: 'thu', label: 'Thu', selected: false },
    { value: 'fri', label: 'Fri', selected: false },
    { value: 'sat', label: 'Sat', selected: false },
  ];

  constructor() {}
}
