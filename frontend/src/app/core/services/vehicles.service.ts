import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Arrival, Vehicle, Vehicles } from '../utils/global.types';
import { WebsocketService } from './websocket.service';
import { formatDistanceToNow } from 'date-fns';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { getBaseUrl } from '../utils/utils';

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private vehiclesLink = `${getBaseUrl()}/api/vehicles`;
  private vehicles: Vehicles = new Map();
  private vehiclesSubject = new BehaviorSubject<Vehicles>(this.vehicles);
  private trackedVehicleSubject = new BehaviorSubject<Vehicle | null>(null);

  vehicles$ = this.vehiclesSubject.asObservable();
  trackedVehicle$ = this.trackedVehicleSubject.asObservable();

  constructor(
    private http: HttpClient,
    private webSocketService: WebsocketService,
    private toastr: ToastrService
  ) {
    this.fetchInitialData();
  }

  private fetchInitialData(): void {
    this.http.get(this.vehiclesLink).subscribe({
      next: (response: any) => {
        if (response?.status === 'success' && Array.isArray(response.data)) {
          this.updateVehicles(response.data);
          this.subscribeToWebSocket();
        } else {
          console.error(`Invalid JSON returned from ${this.vehiclesLink}`);
        }
      },
    });
  }

  private cleanVehicle(vehicle: Vehicle): Vehicle {
    return {
      ...vehicle,
      heartbeat: new Date(vehicle.heartbeat),
      heartbeatFormatted: formatDistanceToNow(vehicle.heartbeat, {
        addSuffix: true,
      }),
    };
  }

  private updateVehicles(vehicles: Vehicle[]): void {
    vehicles.forEach((vehicle) => {
      const cleanedVehicle = this.cleanVehicle(vehicle);
      this.vehicles.set(cleanedVehicle.busNumber, cleanedVehicle);
    });
    this.sortAndUpdateSubject();
  }

  private sortAndUpdateSubject(): void {
    const sortedEntries = Array.from(this.vehicles).sort(
      ([, a], [, b]) => b.heartbeat.getTime() - a.heartbeat.getTime()
    );

    this.vehicles = new Map(sortedEntries);
    this.vehiclesSubject.next(this.vehicles);

    // Trigger update on tracked vehicle if set.
    if (this.trackedVehicleSubject.value) {
      this.updateTrackedVehicle(this.trackedVehicleSubject.value.busNumber);
    }

    console.log('Vehicles sorted and updated. Vehicles:', this.vehicles);
  }

  private subscribeToWebSocket(): void {
    this.webSocketService.getMessages().subscribe({
      next: ({ message }) => {
        if (Array.isArray(message) && message.length > 0) {
          console.log(
            `Data received from websocket. ${message.length} updates.`
          );
          this.updateVehicles(message);
        }
      },
      error: (error) => console.error('Websocket error: ', error),
    });
  }

  updateTrackedVehicle(vehicleNumber: string | null) {
    if (vehicleNumber) {
      const trackedVehicle = this.vehicles.get(vehicleNumber);

      if (!trackedVehicle) {
        this.toastr.error('Bus not found');
        return;
      }

      this.toastr.success('Tracked Vehicle updated');
      this.trackedVehicleSubject.next(trackedVehicle);
    } else {
      this.trackedVehicleSubject.next(null);
      this.toastr.success('Stopped tracking');
    }
  }
}
