import { NgModule } from '@angular/core';
import { MainComponent } from './main.component';
import { MainRoutingModule } from './main-routing.module';
import { WebsocketService } from '../../../shared/services/websocket.service';
import { VehiclesModule } from '../../../shared/components/vehicles/vehicles.module';
import { StopsModule } from '../../../shared/components/stops/stops.module';

@NgModule({
  declarations: [MainComponent],
  imports: [MainRoutingModule, VehiclesModule, StopsModule],
  providers: [WebsocketService],
})
export class MainModule {}
