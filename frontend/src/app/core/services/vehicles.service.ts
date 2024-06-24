import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Vehicle, Vehicles } from '../models/global.model';
import { WebsocketService } from '../../shared/services/websocket.service';
import { formatDistanceToNow } from 'date-fns';

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private vehiclesLink = 'http://localhost:3000/vehicles';
  private state: Vehicles = new Map();
  private stateSubject = new BehaviorSubject<Vehicles>(this.state);

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
      this.state.set(cleanedVehicle.busNumber, cleanedVehicle);
    });
    this.sortAndUpdateSubject();
  }

  private sortAndUpdateSubject(): void {
    const sortedEntries = Array.from(this.state).sort(
      ([, a], [, b]) => b.heartbeat.getTime() - a.heartbeat.getTime()
    );

    this.state = new Map(sortedEntries);
    this.stateSubject.next(this.state);

    console.log('State sorted and updated. New State:', this.state);
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

  getState(): Observable<Vehicles> {
    return this.stateSubject.asObservable();
  }
}
