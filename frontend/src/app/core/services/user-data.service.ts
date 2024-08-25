import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { sideBarModes, Stop, Subscription } from '../utils/global.types';
import { StopsService } from './stops.service';
import { ToastrService } from 'ngx-toastr';
import { LocalStorageService } from './local-storage.service';

@Injectable({ providedIn: 'root' })
export class UserDataService {
  private searchResultSubject = new BehaviorSubject<string>('');
  private sidebarModeSubject = new BehaviorSubject<sideBarModes>(null);
  private showSidebarSubject = new BehaviorSubject<boolean>(false);
  private favoritesSubject = new BehaviorSubject<Stop[]>([]);
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

  constructor(
    private stopsService: StopsService,
    private toastr: ToastrService,
    private localStorageService: LocalStorageService
  ) {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    this.favoritesSubject.next(
      this.localStorageService.getFromLocalStorage<Stop[]>('favorites', [])
    );
  }

  setSearchResult(searchResult: string) {
    this.searchResultSubject.next(searchResult);

    this.updateShowSidebar();
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

  addFavoriteStop(stopId: string) {
    const currentFavorites = this.favoritesSubject.value;
    const stops = this.stopsService.getStops();

    const newStop = stops.find((stop) => stop.stopId === stopId);

    // Return early if stop is not found in stopsService
    if (newStop === undefined) {
      console.error(`Stop ${stopId} not found`);
      this.toastr.error(`Stop ${stopId} not found`);
      return;
    }

    const updatedFavorites = [...currentFavorites, newStop];
    this.favoritesSubject.next(updatedFavorites);
    this.localStorageService.saveToLocalStorage('favorites', updatedFavorites);
    this.toastr.success(`Stop ${newStop.stopName} added to favorites`);
  }

  editFavoriteStop(index: number, newName: string) {
    let favorites = this.favoritesSubject.value;
    if (index < 0 || index > favorites.length - 1) {
      console.error('Invalid index for editFavoriteStop(): ', index);
      return;
    }

    favorites[index].stopName = newName;

    this.localStorageService.saveToLocalStorage('favorites', favorites);
    this.favoritesSubject.next(favorites);
    this.toastr.success(`New Name: ${favorites[index].stopName}`);
  }

  deleteFavorite(index: number) {
    console.log('index is what?', index);
    let newFavorites = this.favoritesSubject.value;

    if (index < 0 || index > newFavorites.length - 1) {
      console.log('Invalid index for editFavoriteStop(): ', index);
      return;
    }

    const deletedFavorite = newFavorites.splice(index, 1);

    this.localStorageService.saveToLocalStorage('favorites', newFavorites);
    this.favoritesSubject.next(newFavorites);
    this.toastr.success(`Deleted: ${deletedFavorite[0].stopName}`);
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
