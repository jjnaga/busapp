import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { StopsService } from '../../../core/services/stops.service';
import { SelectedStop, Stop } from '../../../core/models/global.model';

@Component({
  selector: 'stops-component',
  templateUrl: './stops.component.html',
})
export class StopsComponent implements OnInit, OnDestroy {
  stops: Stop[] = [];
  selectedStop: SelectedStop = undefined;
  subscription: Subscription = new Subscription();

  constructor(private stopsService: StopsService) {}

  ngOnInit(): void {
    // Initial API fetch of stops.
    this.subscription.add(
      this.stopsService.getStopsObservable().subscribe((stops: Stop[]) => {
        this.stops = stops;
      })
    );

    this.subscription.add(
      this.stopsService
        .getSelectedStopObservable()
        .subscribe((stop: SelectedStop) => {
          this.selectedStop = stop;
        })
    );
  }

  onStopClick(stop: Stop) {
    this.stopsService.setSelectedStop(stop);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
