import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { SelectedStop, Stop, StopApiResponse } from '../models/global.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StopsService {
  private vehiclesLink = `${this.getBaseUrl()}/api/stops`;
  private stopsSubject = new BehaviorSubject<Stop[]>([]);
  private selectedStopSubject = new BehaviorSubject<SelectedStop>(undefined);
  private selectedStopDataSubject = new BehaviorSubject<
    StopApiResponse | undefined
  >(undefined);

  stops$ = this.stopsSubject.asObservable();
  selectedStop$ = this.selectedStopSubject.asObservable();
  selectedStopData$ = this.selectedStopDataSubject.asObservable();

  private selectedStopDataLink = (stopCode: string) =>
    `${this.getBaseUrl()}/api/stops/${stopCode}`;

  constructor(private http: HttpClient) {
    this.fetchData();

    this.selectedStop$
      .pipe(
        switchMap((selectedStop) => {
          if (selectedStop) {
            return this.fetchSelectedStopData(
              this.selectedStopSubject.value!.stopCode
            );
          } else {
            return of(undefined);
          }
        })
      )
      .subscribe({
        next: (selectedStopData) => {
          this.selectedStopDataSubject.next(selectedStopData);
        },
        error: (error) => {
          console.error('Unhandled error in stop data stream', error);
          this.selectedStopDataSubject.next(undefined);
        },
      });
  }

  private fetchSelectedStopData(
    stopCode: string
  ): Observable<StopApiResponse | undefined> {
    return this.http.get<any>(this.selectedStopDataLink(stopCode)).pipe(
      map((response) => {
        if (response?.status !== 'success') {
          throw new Error(
            `API returned non-success status: ${response?.error}`
          );
        }
        return response.data;
      }),
      catchError((error) => {
        console.error('Error fetching stop data: ', error);
        return of(undefined);
      })
    );
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

  setSelectedStop(selectedStopCode: string) {
    this.selectedStopSubject.next(
      this.stopsSubject.value.find((stop) => stop.stopCode === selectedStopCode)
    );
  }
}
