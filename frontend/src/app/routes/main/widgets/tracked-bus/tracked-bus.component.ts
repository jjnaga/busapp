import { Component } from '@angular/core';
import { VehiclesService } from '../../../../core/services/vehicles.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { combineLatest, interval, map, switchMap } from 'rxjs';

@Component({
  selector: 'tracked-bus-component',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './tracked-bus.component.html',
  standalone: true,
})
export class TrackedBusComponent {
  faSyncAlt = faSyncAlt;
  private trackedVehicle$ = this.vehiclesService.trackedVehicle$;
  private secondsSinceUpdate$ = this.trackedVehicle$.pipe(
    switchMap((trackedVehicle) =>
      interval(1000).pipe(
        map(() => {
          if (!trackedVehicle?.heartbeat) {
            return null;
          }

          const date = new Date(trackedVehicle.heartbeat).getTime();
          const now = new Date().getTime();
          return Math.floor((now - date) / 1000);
        })
      )
    )
  );

  vehicleData$ = combineLatest([
    this.trackedVehicle$,
    this.secondsSinceUpdate$,
  ]).pipe(
    map(([trackedVehicle, secondsSinceUpdate]) => ({
      ...trackedVehicle,
      secondsSinceUpdate,
    }))
  );

  constructor(private vehiclesService: VehiclesService) {}

  updateTrackedVehicle(vehicleNumber: string | null) {
    this.vehiclesService.updateTrackedVehicle(vehicleNumber);
  }

  getBusMarkerImage(): string {
    return 'bus.png';
  }
}
