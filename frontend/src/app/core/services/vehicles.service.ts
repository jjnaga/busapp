import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Vehicle, Vehicles } from '../models/global.model';
import { WebsocketService } from '../../shared/services/websocket.service';

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private vehiclesLink = 'http://localhost:3000/vehicles';
  private state: Vehicles = {};
  private stateSubject = new BehaviorSubject<Vehicles>(this.state);

  constructor(
    private http: HttpClient,
    private webSocketService: WebsocketService
  ) {
    this.fetchInitialData();
  }

  private fetchInitialData(): void {
    this.http.get(this.vehiclesLink).subscribe((response) => {
      // TODO: maybe not best place here? how handle api data validation
      // @ts-ignore
      console.log('response given', response);
      if (
        response.hasOwnProperty('status') &&
        // @ts-ignore
        response['status'] &&
        // @ts-ignore
        response['status'] === 'success' &&
        response.hasOwnProperty('data')
      ) {
        // @ts-ignore
        response['data'].forEach((vehicle: Vehicle) => {
          const { busNumber } = vehicle;

          this.state = {
            ...this.state,
            [busNumber]: vehicle,
          };
        });
        this.stateSubject.next(this.state);
        this.subscribeToWebSocket();
      } else {
        console.error(`Invalid JSON returned from ${this.vehiclesLink}`);
      }
    });
  }

  private subscribeToWebSocket(): void {
    this.webSocketService
      .getMessages()
      .subscribe(({ message }: { message: string }) => {
        const json = JSON.parse(message);
        const { busNumber } = json;
        this.state = {
          ...this.state,
          [busNumber]: json,
        };
        this.stateSubject.next(this.state);
      });
  }

  getState(): Observable<Vehicles> {
    return this.stateSubject.asObservable();
  }

  updateState(newData: Vehicles) {
    this.state = { ...this.state, ...newData };
    this.stateSubject.next(this.state);
  }

  // fetchData(): Observable<any> {
  //   return this.http.get(this.vehiclesLink);
  // }
}
