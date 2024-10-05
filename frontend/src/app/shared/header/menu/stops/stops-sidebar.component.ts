import { Component, OnInit } from '@angular/core';
import { UserDataService } from '../../../../core/services/user-data.service';
import { Subscription } from 'rxjs';
import { StopsService } from '../../../../core/services/stops.service';
import {
  AppTypes,
  Arrival,
  SelectedStop,
  StopApiResponse,
} from '../../../../core/utils/global.types';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBus,
} from '@fortawesome/free-solid-svg-icons';
import { VehiclesService } from '../../../../core/services/vehicles.service';

@Component({
  selector: 'stops-sidebar',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './stops-sidebar.component.html',
  standalone: true,
})
export class StopsSidebarComponent implements OnInit {
  constructor(
    private userDataService: UserDataService,
    private stopsService: StopsService,
    private vehiclesService: VehiclesService
  ) {}

  private subscriptions: Subscription = new Subscription();
  selectedStop: SelectedStop = undefined;
  selectedStopData: StopApiResponse | undefined = undefined;
  selectedStopTimeFromNow: Date | undefined = undefined;
  liveSeconds$ = this.stopsService.liveSeconds$;

  // Icons
  faBus = faBus;

  ngOnInit(): void {
    this.subscriptions.add(
      this.stopsService.selectedStop$.subscribe((selectedStop) => {
        if (selectedStop) {
          const favorites = this.userDataService.getFavorites();
          const selectedStopInFavorites = favorites.find(
            (favorite) => selectedStop?.stopId === favorite.stopId
          );

          if (selectedStopInFavorites) {
            selectedStop.stopName = selectedStopInFavorites.stopName;
            this.selectedStop = selectedStop;
          } else {
            this.selectedStop = selectedStop;
          }
        }
      })
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
          }
        }
      })
    );
  }

  addNewSubscription(type: AppTypes) {
    this.userDataService.setNewSubscription({
      type,
      stopId: this.selectedStop?.stopId,
    });
    this.userDataService.setSidebarMode('subscriptions');
  }

  addNewFavorite() {
    if (this.selectedStop) {
      this.userDataService.addFavoriteStop(this.selectedStop.stopId);
    }
  }

  onViewBusClick(vehicle: Arrival) {
    this.vehiclesService.updateTrackedVehicle(vehicle.vehicle);
  }
}
