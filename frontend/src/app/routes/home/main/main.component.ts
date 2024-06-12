import { Component, OnInit } from '@angular/core';
import { VehiclesService } from '../../../core/services/vehicles.service';

@Component({
  // selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent {
  vehiclesData = [];

  // constructor(private vehiclesService: VehiclesService) {}
  constructor() {}

  // ngOnInit(): void {
  //   console.log('hehe helo');
  //   this.fetchVehicles();
  // }

  // fetchVehicles(): void {
  //   this.vehiclesService.fetchData().subscribe({
  //     next: (data) => {
  //       this.vehiclesData = data;
  //     },
  //     error: (error) => {
  //       console.error('Error fetching vehicles: ', error);
  //     },
  //     complete: () => {
  //       console.log('DONE!');
  //     },
  //   });
  // }
}
