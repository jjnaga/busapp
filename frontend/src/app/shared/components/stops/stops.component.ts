import { Component } from '@angular/core';
import { StopsService } from '../../../core/services/stops.service';
import { Stop } from '../../../core/models/global.model';

@Component({
  selector: 'stops-component',
  templateUrl: './stops.component.html',
})
export class StopsComponent {
  stops$ = this.stopsService.stops$;
  selectedStop$ = this.stopsService.selectedStop$;

  constructor(private stopsService: StopsService) {}

  onStopClick(stop: Stop) {
    this.stopsService.setSelectedStop(stop);
  }
}
