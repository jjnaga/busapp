import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { StopsService } from '../../../core/services/stops.service';
import { Stop } from '../../../core/models/global.model';

@Component({
  selector: 'stops-component',
  templateUrl: './stops.component.html',
})
export class StopsComponent implements OnInit, OnDestroy {
  stops: Stop[] = [];
  subscription: Subscription = new Subscription();

  constructor(private stopsService: StopsService) {}

  ngOnInit(): void {
    // Initial API fetch of stops.
    this.subscription = this.stopsService
      .getState()
      .subscribe((stops: Stop[]) => {
        this.stops = stops;
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
