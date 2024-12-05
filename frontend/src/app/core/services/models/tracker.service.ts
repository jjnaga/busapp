import {
  combineLatest,
  filter,
  interval,
  map,
  Observable,
  pipe,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { Injectable } from '@angular/core';
import { VehiclesService } from '../../services/vehicles.service';
import { StopsService } from '../../services/stops.service';
import { TrackerModel, TrackerMode } from '../../utils/global.types';
import { differenceInSeconds, formatDistanceToNow, parse } from 'date-fns';

@Injectable({ providedIn: 'root' })
export class TrackerService {
  constructor(
    private vehiclesService: VehiclesService,
    private stopsService: StopsService
  ) {}

  private readonly destroy$ = new Subject<void>();
  private trackedVehicle$ = this.vehiclesService.trackedVehicle$;
  private selectedStop$ = this.stopsService.selectedStop$;
  private selectedStopData$ = this.stopsService.selectedStopData$;
  private selectedBusAtStop$ = this.stopsService.selectedBusAtStop$;

  // Used in trackerData$
  private trackedVehicleSecondsSinceUpdate$ = this.trackedVehicle$.pipe(
    filter((trackedVehicle) => !!trackedVehicle?.heartbeat),
    switchMap((trackedVehicle) =>
      interval(1000).pipe(
        map(() => {
          // trust me 🤭
          const date = new Date(trackedVehicle!.heartbeat).getTime();
          const now = new Date().getTime();
          return Math.floor((now - date) / 1000);
        })
      )
    )
  );

  resetState(): void {
    this.stopsService.setSelectedStop(undefined);
    this.vehiclesService.updateTrackedVehicle(null);
    this.stopsService.setSelectedBusAtStop(undefined);
    this.setTrackerMode(false, false, false);
  }

  private setTrackerMode(
    arrival: boolean,
    stop: boolean,
    vehicle: boolean
  ): TrackerMode {
    const trackerMode: TrackerMode = {
      both: false,
      bus: false,
      stop: false,
    };

    // If arrival, set combined mode.
    if (!!arrival) {
      trackerMode.both = true;
      trackerMode.bus = false;
      trackerMode.stop = false;
      return trackerMode;
    }

    // Set stop and/or bus
    if (!!stop) {
      trackerMode.stop = true;
    }

    if (!!vehicle) {
      trackerMode.bus = true;
      return trackerMode;
    }

    return trackerMode;
  }

  trackerData$: Observable<TrackerModel> = combineLatest([
    this.trackedVehicle$,
    this.trackedVehicleSecondsSinceUpdate$.pipe(startWith(undefined)),
    this.selectedStop$,
    this.selectedStopData$,
    this.selectedBusAtStop$,
  ]).pipe(
    map(
      ([
        trackedVehicle,
        trackedVehicleSecondsSinceUpdate,
        selectedStop,
        selectedStopData,
        selectedBusAtStop,
      ]) => {
        const vehicle =
          trackedVehicle !== null &&
          trackedVehicleSecondsSinceUpdate !== undefined
            ? {
                ...trackedVehicle!,
                lastUpdated: trackedVehicleSecondsSinceUpdate,
              }
            : undefined;

        const stop = selectedStop ?? undefined;
        let arrival = selectedStopData?.arrivals.find(
          (arrival) => arrival.vehicle === selectedBusAtStop?.busNumber
        );

        if (arrival) {
          const timeToArrival = parse(arrival.stopTime, 'h:mm a', new Date());
          const stopTimeInMinutes = formatDistanceToNow(timeToArrival, {
            addSuffix: true,
          });

          arrival = { ...arrival, stopTimeInMinutes };
        }

        const trackerMode = this.setTrackerMode(!!arrival, !!stop, !!vehicle);

        return {
          vehicle,
          stop,
          arrival,
          mode: trackerMode,
        };
      }
    ),
    takeUntil(this.destroy$) // Automatically unsubscribes on destroy
  );

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
