import { Component, OnInit } from '@angular/core';
import { UserDataService } from '../../../../core/services/user-data.service';
import { Subscription } from 'rxjs';
import { StopsService } from '../../../../core/services/stops.service';
import {
  Arrival,
  SelectedStop,
  StopApiResponse,
} from '../../../../core/models/global.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'stops-sidebar',
  imports: [CommonModule],
  templateUrl: './stops-sidebar.component.html',
  standalone: true,
})
export class StopsSidebarComponent implements OnInit {
  private subscriptions: Subscription = new Subscription();
  selectedStop: SelectedStop = undefined;
  selectedStopData: StopApiResponse | undefined = undefined;

  constructor(
    private userDataService: UserDataService,
    private stopsService: StopsService
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
        }
      })
    );
  }
}
