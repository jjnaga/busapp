import { Component } from '@angular/core';
import { VehiclesService } from '../../../../core/services/vehicles.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tracked-bus-component',
  imports: [CommonModule],
  templateUrl: './tracked-bus.component.html',
  standalone: true,
})
export class TrackedBusComponent {
  trackedVehicle$ = this.vehiclesService.trackedVehicle$;

  constructor(private vehiclesService: VehiclesService) {}

  updateTrackedVehicle(vehicleNumber: string | null) {
    this.vehiclesService.updateTrackedVehicle(vehicleNumber);
  }
}
