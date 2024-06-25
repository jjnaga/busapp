import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SelectedStop, Stop } from '../models/global.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StopsService {
  private vehiclesLink = `${this.getBaseUrl()}/api/stops`;
  private stopsSubject = new BehaviorSubject<Stop[]>([]);
  private selectedStopSubject = new BehaviorSubject<SelectedStop>(undefined);

  constructor(private http: HttpClient) {
    this.fetchData();
  }

  private getBaseUrl(): string {
    const protocol = window.location.protocol;
    let host = window.location.host;

    if (!environment.production) {
      host = 'localhost:3000';
    }

    return `${protocol}//${host}`;
  }

  private fetchData(): void {
    this.http.get(this.vehiclesLink).subscribe({
      next: (response: any) => {
        if (response?.status === 'success' && Array.isArray(response.data)) {
          this.stopsSubject.next(response.data);
        } else {
          console.error(`Invalid JSON returned from ${this.vehiclesLink}`);
        }
      },
    });
  }

  getStopsObservable(): Observable<Stop[]> {
    return this.stopsSubject.asObservable();
  }

  getSelectedStopObservable(): Observable<SelectedStop> {
    return this.selectedStopSubject.asObservable();
  }

  setSelectedStop(stop: Stop) {
    this.selectedStopSubject.next(stop);
  }
}
