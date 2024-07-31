import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { sideBarModes, Subscription } from '../utils/global.types';
import { StopsService } from './stops.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserDataService {
  private searchResultSubject = new BehaviorSubject<string>('');
  private sidebarModeSubject = new BehaviorSubject<sideBarModes>(null);
  private showSidebarSubject = new BehaviorSubject<boolean>(false);
  private favoritesSubject = new BehaviorSubject<any[]>([]);
  private newSubscriptionSubject = new BehaviorSubject<Subscription | null>(
    null
  );
  private subscriptionsSubject = new BehaviorSubject<Subscription[]>([]);

  searchResult$ = this.searchResultSubject.asObservable();
  sidebarMode$ = this.sidebarModeSubject.asObservable();
  showSidebar$ = this.showSidebarSubject.asObservable();
  favorites$ = this.favoritesSubject.asObservable();
  newSubscription$ = this.newSubscriptionSubject.asObservable();
  subscriptions$ = this.subscriptionsSubject.asObservable();

  constructor(private stopsService: StopsService) {}

  ngOnInit(): void {
    console.log('hehe');
  }

  setSearchResult(searchResult: string) {
    this.searchResultSubject.next(searchResult);
    this.updateShowSidebar();
    console.log('im changed hehe', this.searchResultSubject.value);
  }

  setSidebarMode(mode: sideBarModes) {
    this.sidebarModeSubject.next(mode);
    this.updateShowSidebar();
  }

  updateShowSidebar() {
    const showSidebar =
      this.searchResultSubject.value.length > 0 ||
      this.sidebarModeSubject.value !== null;
    this.showSidebarSubject.next(showSidebar);
  }

  resetSidebar() {
    this.showSidebarSubject.next(false);
    this.searchResultSubject.next('');
    this.sidebarModeSubject.next(null);
  }

  setFavorite(favorite: any) {
    const currentFavorites = this.favoritesSubject.value;
    const updatedFavorites = [...currentFavorites, favorite];
    this.favoritesSubject.next(updatedFavorites);
  }

  setSelectedStop(stop: string) {
    this.stopsService.setSelectedStop(stop);
    this.showSidebarSubject.next(true);
    this.sidebarModeSubject.next('stop');
  }

  setNewSubscription(subscription?: Subscription) {
    if (subscription) {
      this.newSubscriptionSubject.next(subscription);
    } else {
      this.newSubscriptionSubject.next(null);
    }
  }
}
