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
  private favoritesInViewSubject = new BehaviorSubject<Stop[]>([]);
  private favoritesInViewIndexSubject = new BehaviorSubject<number | null>(
    null
  );
  private selectedFavoriteIndexSubject = new BehaviorSubject<number | null>(
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
  favoritesInView$ = this.favoritesInViewSubject.asObservable();
  favoritesInViewIndex$ = this.favoritesInViewIndexSubject.asObservable();
  selectedFavoriteIndex$ = this.selectedFavoriteIndexSubject.asObservable();
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

  getFavoritesInViewIndex(): number | null {
    const favoritesInViewIndexSubject =
      this.favoritesInViewIndexSubject.getValue();

    return favoritesInViewIndexSubject ?? null;
  }

  setFavoritesInViewIndex(index: number): void {
    // Show the current favorite stop that is in view.
    this.stopsService.setSelectedStop(this.getFavoritesInView()[index].stopId);
    this.favoritesInViewIndexSubject.next(index);
  }

  incrementFavoritesInViewIndex(): void {
    if (this.favoritesInViewIndexSubject.getValue() === null) {
      this.toastr.error('No Favorite Bus Stops Nearby');
      return;
    }

    this.favoritesInViewIndexSubject.next(
      (this.favoritesInViewIndexSubject.getValue()! + 1) %
        this.favoritesInViewSubject.getValue().length
    );
  }

  decrementFavoritesInViewIndex(): void {
    if (this.favoritesInViewIndexSubject.getValue() === null) {
      this.toastr.error('No Favorite Bus Stops Nearby');
      return;
    }

    this.favoritesInViewIndexSubject.next(
      (this.favoritesInViewIndexSubject.getValue()! - 1) %
        this.favoritesInViewSubject.getValue().length
    );
  }

  setSelectedFavoriteIndex(newIndex: number) {
    if (newIndex < 0 || newIndex > this.favoritesSubject.value.length - 1) {
      console.error(
        'setSelectedFavoriteIndex: index of out bounds. Index=',
        newIndex
      );
      return;
    }

    this.selectedFavoriteIndexSubject.next(newIndex);
  }

  setSidebarMode(mode: sideBarModes) {
    this.sidebarModeSubject.next(mode);
    this.updateShowSidebar();
  }

  updateShowSidebar() {
    const showSidebar = this.sidebarModeSubject.value !== null;
    this.showSidebarSubject.next(showSidebar);
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

  getFavoritesInView() {
    return this.favoritesInViewSubject.getValue();
  }

  setFavoritesInView(favorites: Stop[]) {
    this.favoritesInViewSubject.next(favorites);
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
      this.favoritesInViewIndex$.subscribe((index) => {
        if (index !== null) {
          this.stopsService.setSelectedStop(
            this.getFavoritesInView()[index].stopCode
          );
        }
      })
    );
  }

  destroy() {
    this.subscriptions.unsubscribe();
  }
}
