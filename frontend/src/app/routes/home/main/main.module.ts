import { NgModule } from '@angular/core';
import { MainComponent } from './main.component';
import { MainRoutingModule } from './main-routing.module';
import { WebsocketService } from '../../../core/services/websocket.service';
import { GoogleMapComponent } from '../../../shared/components/google-map/google-map.component';
import { SubscribeComponent } from '../../../shared/components/subscribe-menu/subscribe-menu.component';

@NgModule({
  declarations: [MainComponent],
  imports: [MainRoutingModule, GoogleMapComponent, SubscribeComponent],
  providers: [WebsocketService],
})
export class MainModule {}
