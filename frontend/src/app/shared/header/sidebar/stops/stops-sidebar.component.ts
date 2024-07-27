import { Component, OnInit } from '@angular/core';
import { UserDataService } from '../../../../core/services/user-data.service';
import { Subscription } from 'rxjs';
import { StopsService } from '../../../../core/services/stops.service';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Arrival,
  SelectedStop,
  StopApiResponse,
} from '../../../../core/models/global.model';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBus } from '@fortawesome/free-solid-svg-icons';
import { VehiclesService } from '../../../../core/services/vehicles.service';

@Component({
  selector: 'stops-sidebar',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './stops-sidebar.component.html',
  standalone: true,
})
export class StopsSidebarComponent implements OnInit {
  private subscriptions: Subscription = new Subscription();
  selectedStop: SelectedStop = undefined;
  selectedStopData: StopApiResponse | undefined = undefined;
  selectedStopTimeFromNow: Date | undefined = undefined;
  liveSeconds$ = this.stopsService.liveSeconds$;
  faBus = faBus;

  constructor(
    private userDataService: UserDataService,
    private stopsService: StopsService,
    private vehiclesService: VehiclesService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.stopsService.selectedStop$.subscribe(
        (selectedStop) => (this.selectedStop = selectedStop)
      )
    );

    this.subscriptions.add(
      this.stopsService.selectedStopData$.subscribe((selectedStopData) => {
        if (selectedStopData !== undefined) {
          this.selectedStopData = selectedStopData;

          if (
            selectedStopData.timestamp instanceof Date &&
            !isNaN(selectedStopData.timestamp.getTime())
          ) {
            this.selectedStopTimeFromNow = new Date();
            // this.selectedStopTimeFromNow = formatDistanceToNow(
            //   selectedStopData.timestamp,
            //   { addSuffix: true }
            // );
          }
        }
      })
    );
  }

  onViewBusClick(vehicle: Arrival) {
    this.vehiclesService.updateTrackedVehicle(vehicle.vehicle);
  }
}
