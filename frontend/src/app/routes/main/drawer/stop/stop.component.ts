import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { Arrival, Stop } from '../../../../core/utils/global.types';
import { selectSelectedStop } from '../../../../core/state/lib/stops/stops.selectors';
import { selectDrawerExpanded, selectSelectedVehicle } from '../../../../core/state/lib/user/user.selectors';
import { DiffMinutesPipe } from '../../../../core/utils/pipes/diff-minutes.pipe';
import { selectIsFavorite } from '../../../../core/state/lib/favorites/favorites.selectors';
import * as UserActions from '../../../../core/state/lib/user/user.actions';
import * as FavoritesActions from '../../../../core/state/lib/favorites/favorites.actions';
import { faClose, faHeart } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DirectorService } from '../../../../core/services/director.service';

@Component({
  selector: 'drawer-stop',
  templateUrl: './stop.component.html',
  standalone: true,
  imports: [CommonModule, DiffMinutesPipe, FontAwesomeModule],
})
export class StopComponent implements OnInit {
  store = inject(Store);
  private cameraDirector = inject(DirectorService);
  UserActions = UserActions;
  FavoritesActions = FavoritesActions;
  faClose = faClose;
  drawerExpanded$: Observable<boolean> = this.store.select(selectDrawerExpanded);
  selectedStop$: Observable<Stop | undefined> = this.store.select(selectSelectedStop);
  selectedVehicle$ = this.store.select(selectSelectedVehicle);
  isFavorite$!: Observable<boolean>;
  faHeart = faHeart;

  ngOnInit(): void {
    // Whenever the selected stop changes, update the isFavorite$ observable.
    this.isFavorite$ = this.selectedStop$.pipe(
      filter((stop): stop is Stop => !!stop),
      switchMap((stop) => this.store.select(selectIsFavorite(stop.stopId)))
    );
  }

  setSelectedArrival(arrival: Arrival): void {
    if (arrival.vehicle === '???' || !arrival.vehicle) {
      return;
    }

    this.store.dispatch(UserActions.setSelectedVehicle({ vehicleId: arrival.vehicle }));
    this.cameraDirector.setIncomingBusMode();
  }
}
