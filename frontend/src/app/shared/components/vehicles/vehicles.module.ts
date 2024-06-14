import { NgModule } from '@angular/core';
import { VehiclesComponent } from './vehicles.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [VehiclesComponent],
  imports: [CommonModule],
  exports: [VehiclesComponent],
})
export class VehiclesModule {}
