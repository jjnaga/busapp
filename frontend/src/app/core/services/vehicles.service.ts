import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Vehicle, Vehicles } from '../models/global.model';
import { WebsocketService } from '../../shared/services/websocket.service';
import { formatDistanceToNow } from 'date-fns';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private vehicles: Vehicles = new Map();
  private vehiclesSubject = new BehaviorSubject<Vehicles>(this.vehicles);

  constructor(
    private http: HttpClient,
    private webSocketService: WebsocketService
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

  private getBaseUrl(): string {
    const protocol = window.location.protocol;
    let host = window.location.host;

    if (!environment.production) {
      host = 'localhost:3000';
    }

    return `${protocol}//${host}`;
  }

  private vehiclesLink = `${this.getBaseUrl()}/api/vehicles`;

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

  getVehiclesObservable(): Observable<Vehicles> {
    return this.vehiclesSubject.asObservable();
  }
}
