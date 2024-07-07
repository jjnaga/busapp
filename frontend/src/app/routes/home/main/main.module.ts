import { NgModule } from '@angular/core';
import { MainComponent } from './main.component';
import { MainRoutingModule } from './main-routing.module';
import { WebsocketService } from '../../../shared/services/websocket.service';
import { VehiclesModule } from '../../../shared/components/vehicles/vehicles.module';
import { StopsModule } from '../../../shared/components/stops/stops.module';
import { GoogleMapComponent } from '../../../shared/components/google-map/google-map.component';

@NgModule({
  declarations: [MainComponent],
  imports: [MainRoutingModule, VehiclesModule, StopsModule, GoogleMapComponent],
  providers: [WebsocketService],
})
export class MainModule {}
