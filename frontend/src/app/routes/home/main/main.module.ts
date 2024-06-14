import { NgModule } from '@angular/core';
import { MainComponent } from './main.component';
import { CommonModule } from '@angular/common';
import { MainRoutingModule } from './main-routing.module';
import { WebsocketService } from '../../../shared/services/websocket.service';
import { VehiclesModule } from '../../../shared/components/vehicles/vehicles.module';

@NgModule({
  declarations: [MainComponent],
  imports: [MainRoutingModule, VehiclesModule],
  providers: [WebsocketService],
})
export class MainModule {}
