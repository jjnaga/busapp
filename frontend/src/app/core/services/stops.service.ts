import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Stop } from '../models/global.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StopsService {
  private vehiclesLink = `${this.getBaseUrl()}/api/stops`;
  private state: Stop[] = [];
  private stateSubject = new BehaviorSubject<Stop[]>(this.state);

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
          this.state = response.data;
          this.stateSubject.next(this.state);
        } else {
          console.error(`Invalid JSON returned from ${this.vehiclesLink}`);
        }
      },
    });
  }

  getState(): Observable<Stop[]> {
    return this.stateSubject.asObservable();
  }
}
