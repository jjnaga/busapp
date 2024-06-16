import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { Vehicle, Vehicles } from '../../../core/models/global.model';
import { formatDistanceToNow } from 'date-fns';

@Component({
  selector: 'vehicles-component',
  templateUrl: './vehicles.component.html',
})
export class VehiclesComponent implements OnInit, OnDestroy {
  vehicles: Vehicle[] = [];
  subscription: Subscription = new Subscription();

  constructor(private vehiclesService: VehiclesService) {}

  ngOnInit(): void {
    // Initial API fetch of vehicles.
    this.subscription = this.vehiclesService
      .getState()
      .subscribe((vehicles: Vehicles) => {
        Object.keys(vehicles).forEach((vehicleNumber) => {
          const vehicle = vehicles[vehicleNumber];
          const heartbeatFormatted = formatDistanceToNow(vehicle.heartbeat, {
            addSuffix: true,
          });
          vehicle.heartbeatFormatted = heartbeatFormatted;
        });
        this.vehicles = Object.values(vehicles);
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
