import { Component, OnInit } from '@angular/core';
import { VehiclesService } from '../../../core/services/vehicles.service';

@Component({
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent {
  vehiclesData = [];

  constructor(private vehiclesService: VehiclesService) {}

  ngOnInit(): void {
    this.fetchVehicles();
  }

  fetchVehicles(): void {
    this.vehiclesService.fetchData().subscribe({
      // TODO: Is this where you do fetch validation and error handling?
      // TODO: Set types for data
      next: (data) => {
        this.vehiclesData = data.data;
      },
      error: (error) => {
        console.error('Error fetching vehicles: ', error);
      },
    });
  }
}
