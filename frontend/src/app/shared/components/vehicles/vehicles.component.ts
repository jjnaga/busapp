import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { Vehicle, Vehicles } from '../../../core/models/global.model';

@Component({
  selector: 'vehicles-component',
  templateUrl: './vehicles.component.html',
})
export class VehiclesComponent {
  vehicles$ = this.vehiclesService.vehicles$;

  constructor(private vehiclesService: VehiclesService) {}
}
