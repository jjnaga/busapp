import { NgModule } from '@angular/core';
import { MainComponent } from './main.component';
import { MainRoutingModule } from './main-routing.module';
import { WebsocketService } from '../../../core/services/websocket.service';
import { GoogleMapComponent } from '../../../shared/components/google-map/google-map.component';
import { WidgetsComponent } from '../../../shared/header/widgets/widgets.component';
import { HeaderComponent } from '../../../shared/header/header.component';

@NgModule({
  declarations: [MainComponent],
  imports: [
    MainRoutingModule,
    HeaderComponent,
    GoogleMapComponent,
    WidgetsComponent,
  ],
  providers: [WebsocketService],
})
export class MainModule {}
