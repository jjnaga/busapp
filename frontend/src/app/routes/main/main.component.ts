import {
  Component,
  AfterViewInit,
  ViewContainerRef,
  Injector,
} from '@angular/core';
import { WebsocketService } from '../../core/services/websocket.service';
import { GoogleMapComponent } from './google-map/google-map.component';
import { HeaderComponent } from '../../shared/header/header.component';

@Component({
  standalone: true,
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
  imports: [HeaderComponent, GoogleMapComponent],
  providers: [WebsocketService],
})
export class MainComponent implements AfterViewInit {
  constructor(
    private viewContainerRef: ViewContainerRef,
    private injector: Injector
  ) {}

  ngAfterViewInit() {
    import('./widgets/widgets.component').then(({ WidgetsComponent }) => {
      this.viewContainerRef.createComponent(WidgetsComponent, {
        injector: this.injector,
      });
    });

    import('./menu/menu.component').then(({ MenuComponent }) => {
      this.viewContainerRef.createComponent(MenuComponent, {
        injector: this.injector,
      });
    });
  }
}
