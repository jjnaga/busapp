import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackedBusComponent } from './tracked-bus/tracked-bus.component';

@Component({
  selector: 'widgets-component',
  imports: [CommonModule, TrackedBusComponent],
  templateUrl: './widgets.component.html',
  standalone: true,
})
export class WidgetsComponent {
  constructor() {}
}
