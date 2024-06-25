import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { Vehicle, Vehicles } from '../../../core/models/global.model';

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
      .getVehiclesObservable()
      .subscribe((vehicles: Vehicles) => {
        const newVehicles: Vehicle[] = [];
        for (const [vehicleNumber, vehicle] of vehicles) {
          console.log();
          newVehicles.push(vehicle);
          this.vehicles = newVehicles;
        }
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
