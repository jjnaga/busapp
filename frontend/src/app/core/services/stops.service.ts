import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  interval,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { SelectedStop, Stop, StopApiResponse } from '../utils/global.types';
import { environment } from '../../../environments/environment';
import { getBaseUrl } from '../utils/utils';

@Injectable({ providedIn: 'root' })
export class StopsService {
  private vehiclesLink = `${getBaseUrl()}/api/stops`;
  private stopsSubject = new BehaviorSubject<Stop[]>([]);
  private selectedStopSubject = new BehaviorSubject<SelectedStop>(undefined);
  private selectedStopDataSubject = new BehaviorSubject<
    StopApiResponse | undefined
  >(undefined);
  private selectedStopDataCreatedAtSubject = new BehaviorSubject<
    Date | undefined
  >(undefined);

  stops$ = this.stopsSubject.asObservable();
  selectedStop$ = this.selectedStopSubject.asObservable();
  selectedStopData$ = this.selectedStopDataSubject.asObservable();
  selectedStopDataCreatedAt$ =
    this.selectedStopDataCreatedAtSubject.asObservable();

  liveSeconds$ = combineLatest([
    interval(1000),
    this.selectedStopDataCreatedAt$,
  ]).pipe(
    map(([_, createdAt]) => {
      if (createdAt) {
        const now = new Date();
        return Math.floor((now.getTime() - createdAt.getTime()) / 1000);
      }

      return 0;
    })
  );

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
          if (selectedStopData) {
            // Transform
            // Load
            this.selectedStopDataSubject.next({
              ...selectedStopData,
              timestamp: new Date(selectedStopData.timestamp),
            });

            this.selectedStopDataCreatedAtSubject.next(new Date());
          } else {
            this.selectedStopDataCreatedAtSubject.next(undefined);
            this.selectedStopDataSubject.next(undefined);
          }
        },
        error: (error) => {
          console.error('Unhandled error in stop data stream', error);
          this.selectedStopDataSubject.next(undefined);
        },
      });
  }

  private selectedStopDataLink = (stopCode: string) =>
    `${this.getBaseUrl()}/api/stops/${stopCode}`;

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
