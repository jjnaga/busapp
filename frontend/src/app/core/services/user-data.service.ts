import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, tap } from 'rxjs';
import { sideBarModes, Stop, BusSubscription } from '../utils/global.types';
import { StopsService } from './stops.service';
import { ToastrService } from 'ngx-toastr';
import { LocalStorageService } from './local-storage.service';

@Injectable({ providedIn: 'root' })
export class UserDataService {
  private sidebarModeSubject = new BehaviorSubject<sideBarModes>(null);
  private showSidebarSubject = new BehaviorSubject<boolean>(false);
  private favoritesSubject = new BehaviorSubject<Stop[]>([]);
  private favoritesNearbySubject = new BehaviorSubject<Stop[]>([]);
  private favoritesNearbyIndexSubject = new BehaviorSubject<number | null>(
    null
  );
  private newSubscriptionSubject = new BehaviorSubject<BusSubscription | null>(
    null
  );
  private subscriptionsSubject = new BehaviorSubject<BusSubscription[]>([]);
  private subscriptions: Subscription = new Subscription();

  sidebarMode$ = this.sidebarModeSubject.asObservable();
  showSidebar$ = this.showSidebarSubject.asObservable();
  favorites$ = this.favoritesSubject.asObservable();
  favoritesNearby$ = this.favoritesNearbySubject.asObservable();
  favoritesNearbyIndex$ = this.favoritesNearbyIndexSubject.asObservable();
  newSubscription$ = this.newSubscriptionSubject.asObservable();
  subscriptions$ = this.subscriptionsSubject.asObservable();

  constructor(
    private stopsService: StopsService,
    private toastr: ToastrService,
    private localStorageService: LocalStorageService
  ) {
    this.loadFromLocalStorage();
    this.initializeSubscriptions();
  }

  private loadFromLocalStorage(): void {
    this.favoritesSubject.next(
      this.localStorageService.getFromLocalStorage<Stop[]>('favorites', [])
    );
  }

  getfavoritesNearbyIndex(): number | null {
    const favoritesNearbyIndexSubject =
      this.favoritesNearbyIndexSubject.getValue();

    return favoritesNearbyIndexSubject ?? null;
  }

  incrementfavoritesNearbyIndex(): void {
    if (this.favoritesNearbyIndexSubject.getValue() === null) {
      this.toastr.error('No Favorite Bus Stops Nearby');
      return;
    }

    const nextIndex =
      (this.favoritesNearbyIndexSubject.getValue()! + 1) %
      this.favoritesNearbySubject.getValue().length;

    this.favoritesNearbyIndexSubject.next(nextIndex);
    this.stopsService.setSelectedStop(
      this.getfavoritesNearby()[nextIndex].stopId
    );
  }

  decrementfavoritesNearbyIndex(): void {
    if (this.favoritesNearbyIndexSubject.value === null) {
      this.toastr.error('No Favorite Bus Stops Nearby');
      return;
    }

    const nextIndex =
      this.favoritesNearbyIndexSubject.value <= 0
        ? this.favoritesNearbySubject.value.length - 1
        : this.favoritesNearbyIndexSubject.value - 1;

    this.favoritesNearbyIndexSubject.next(nextIndex);
    this.stopsService.setSelectedStop(
      this.getfavoritesNearby()[nextIndex].stopId
    );
  }

  setSidebarMode(mode: sideBarModes) {
    const currentMode = this.sidebarModeSubject.value;

    if (currentMode === mode) {
      this.sidebarModeSubject.next(null);
    } else {
      this.sidebarModeSubject.next(mode);
    }
    this.updateShowSidebar();
  }

  updateShowSidebar() {
    this.showSidebarSubject.next(!this.sidebarModeSubject.value);
  }

  resetSidebar() {
    this.showSidebarSubject.next(false);
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
    let newFavorites = this.favoritesSubject.value;

    if (index < 0 || index > newFavorites.length - 1) {
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

  getfavoritesNearby() {
    return this.favoritesNearbySubject.getValue();
  }

  setfavoritesNearby(favorites: Stop[]) {
    this.favoritesNearbySubject.next(favorites);
  }

  setfavoritesNearbyIndex(index: number) {
    if (index < 0) {
      this.toastr.error('Favorites Nearby Index cannot be less than 0');
      return;
    }

    if (index > this.favoritesNearbySubject.value.length) {
      this.toastr.error('Favorites Nearby Index out of bounds');
      return;
    }

    this.favoritesNearbyIndexSubject.next(index);
  }

  setNewSubscription(subscription?: BusSubscription) {
    if (subscription) {
      this.newSubscriptionSubject.next(subscription);
    } else {
      this.newSubscriptionSubject.next(null);
    }
  }

  getFavorites() {
    return this.favoritesSubject.getValue();
  }

  private initializeSubscriptions(): void {
    this.subscriptions.add(
      this.favoritesNearbyIndex$.subscribe((index) => {
        if (index !== null) {
          this.stopsService.setSelectedStop(
            this.getfavoritesNearby()[index].stopCode
          );
        }
      })
    );
  }

  destroy() {
    this.subscriptions.unsubscribe();
  }
}
