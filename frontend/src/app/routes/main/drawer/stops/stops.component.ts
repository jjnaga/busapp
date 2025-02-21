import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { filter, switchMap, map } from 'rxjs/operators';
import { Stop } from '../../../../core/utils/global.types';
import {
  selectAllStopsSortedByDistance,
  selectSelectedStop,
  selectStopsLoading,
} from '../../../../core/state/lib/stops/stops.selectors';
import { selectDrawerExpanded } from '../../../../core/state/lib/user/user.selectors';
import { DiffMinutesPipe } from '../../../../core/utils/pipes/diff-minutes.pipe';
import { selectIsFavorite } from '../../../../core/state/lib/favorites/favorites.selectors';
import * as StopsActions from '../../../../core/state/lib/stops/stops.actions';
import * as UserActions from '../../../../core/state/lib/user/user.actions';
import * as FavoritesActions from '../../../../core/state/lib/favorites/favorites.actions';
import { selectIsMobile } from '../../../../core/state/lib/layout/layout.selectors';
import { ReadableDistancePipe } from '../../../../core/utils/pipes/distance.pipe';
import { faArrowLeft, faArrowRight, faClose, faHeart } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { selectStopsSortedWithFavoritesAndPreferences } from '../../../../core/state/views/stop-view.selector';

@Component({
  selector: 'drawer-stops',
  templateUrl: './stops.component.html',
  standalone: true,
  imports: [CommonModule, DiffMinutesPipe, ReadableDistancePipe, FontAwesomeModule],
})
export class StopsComponent implements OnInit, AfterViewInit {
  StopsActions = StopsActions;
  UserActions = UserActions;
  faHeart = faHeart;
  FavoritesActions = FavoritesActions;
  faArrowLeft = faArrowLeft;
  faArrowRight = faArrowRight;
  faClose = faClose;

  store = inject(Store);

  drawerExpanded$: Observable<boolean> = this.store.select(selectDrawerExpanded);
  stopsLoading$: Observable<boolean> = this.store.select(selectStopsLoading);
  selectedStop$: Observable<Stop | undefined> = this.store.select(selectSelectedStop);
  selectStopsSortedWithFavoritesAndPreferences$: Observable<Stop[]> = this.store.select(selectStopsSortedWithFavoritesAndPreferences);
  isMobile$ = this.store.select(selectIsMobile);

  isFavorite$!: Observable<boolean>;

  // Pagination: start by displaying 20 stops.
  private displayLimit$ = new BehaviorSubject<number>(20);
  paginatedStops$: Observable<Stop[]> = combineLatest([this.selectStopsSortedWithFavoritesAndPreferences$, this.displayLimit$]).pipe(
    map(([stops, limit]) => stops.slice(0, limit))
  );

  @ViewChild('loadMore') loadMore!: ElementRef;

  ngOnInit(): void {
    // Whenever the selected stop changes, update the isFavorite$ observable.
    this.isFavorite$ = this.selectedStop$.pipe(
      filter((stop): stop is Stop => !!stop),
      switchMap((stop) => this.store.select(selectIsFavorite(stop.stopId)))
    );
  }

  ngAfterViewInit() {
    if (!this.loadMore) return;

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 1.0,
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadMoreStops();
      }
    }, options);

    observer.observe(this.loadMore.nativeElement);
  }

  loadMoreStops() {
    const currentLimit = this.displayLimit$.getValue();
    this.displayLimit$.next(currentLimit + 20);
  }
}
