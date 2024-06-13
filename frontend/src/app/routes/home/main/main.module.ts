import { NgModule } from '@angular/core';
import { MainComponent } from './main.component';
import { CommonModule } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { MainRoutingModule } from './main-routing.module';
import { VehicleUpdatesComponent } from '../../../shared/components/vehicles/vehicle-updates.component';
import { WebsocketService } from '../../../shared/services/websocket.service';
// import { MainRoutingModule } from './main-routing.module';

@NgModule({
  declarations: [MainComponent, VehicleUpdatesComponent],
  imports: [CommonModule, MainRoutingModule],
  providers: [WebsocketService],
})
export class MainModule {}
