import { Component, isDevMode } from '@angular/core';
// import { WebsocketService } from '../../core/services/websocket.service';
import { MapComponent } from './map/map.component';
import { CommonModule } from '@angular/common';
import { DrawerComponent } from './drawer/drawer.component';

@Component({
  standalone: true,
  templateUrl: './main.component.html',
  imports: [MapComponent, CommonModule, DrawerComponent],
  // providers: [WebsocketService],
})
export class MainComponent {
  isDevMode = isDevMode();

  constructor() {}
}
