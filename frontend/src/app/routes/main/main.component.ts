import {
  Component,
  AfterViewInit,
  Injector,
  ViewChild,
  ViewContainerRef,
  ElementRef,
} from '@angular/core';
import { WebsocketService } from '../../core/services/websocket.service';
import { GoogleMapComponent } from './google-map/google-map.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { UserDataService } from '../../core/services/user-data.service';
import { CommonModule } from '@angular/common';
import { tap } from 'rxjs';

@Component({
  standalone: true,
  templateUrl: './main.component.html',
  imports: [HeaderComponent, GoogleMapComponent, CommonModule],
  providers: [WebsocketService],
})
export class MainComponent implements AfterViewInit {
  constructor(
    private injector: Injector,
    private userDataService: UserDataService
  ) {}

  @ViewChild('menuComponent', { read: ViewContainerRef })
  menuContainer!: ViewContainerRef;
  @ViewChild('widgetsComponent', { read: ViewContainerRef })
  widgetsContainer!: ViewContainerRef;

  sidebarMode$ = this.userDataService.sidebarMode$.pipe(
    tap((data) => console.log(data))
  );

  ngAfterViewInit() {
    import('./widgets/widgets.component').then(({ WidgetsComponent }) => {
      this.widgetsContainer.createComponent(WidgetsComponent, {
        injector: this.injector,
      });
    });

    import('./menu/menu.component').then(({ MenuComponent }) => {
      this.menuContainer.createComponent(MenuComponent, {
        injector: this.injector,
      });
    });
  }
}
