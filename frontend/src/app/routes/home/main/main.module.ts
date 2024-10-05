import { NgModule } from '@angular/core';
import { MainComponent } from './main.component';
import { MainRoutingModule } from './main-routing.module';
import { WebsocketService } from '../../../core/services/websocket.service';
import { GoogleMapComponent } from './google-map/google-map.component';
import { WidgetsComponent } from './widgets/widgets.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { MenuComponent } from './menu/menu.component';

@NgModule({
  declarations: [MainComponent],
  imports: [
    MainRoutingModule,
    HeaderComponent,
    MenuComponent,
    GoogleMapComponent,
    WidgetsComponent,
    MenuComponent,
  ],
  providers: [WebsocketService],
})
export class MainModule {}
