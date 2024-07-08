import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { sideBarModes } from '../models/global.model';

@Injectable({ providedIn: 'root' })
export class UserDataService {
  private searchResultSubject = new BehaviorSubject<string>('');
  private sidebarModeSubject = new BehaviorSubject<sideBarModes>(null);
  private showSidebarSubject = new BehaviorSubject<boolean>(false);
  private favoritesSubject = new BehaviorSubject<any[]>([]);
  private selectedStopSubject = new BehaviorSubject<string | null>(null);

  searchResult$ = this.searchResultSubject.asObservable();
  sidebarMode$ = this.sidebarModeSubject.asObservable();
  // .pipe(tap((sidebar) => console.log('sidebarmode changed', sidebar)));
  showSidebar$ = this.showSidebarSubject.asObservable();
  favorites$ = this.favoritesSubject.asObservable();

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
    console.log('huh?', this.showSidebarSubject.value);
    const showSidebar =
      this.searchResultSubject.value.length > 0 ||
      this.sidebarModeSubject.value !== null;
    this.showSidebarSubject.next(showSidebar);
    console.log('huh?', this.showSidebarSubject.value);
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
    this.selectedStopSubject.next(stop);
    this.showSidebarSubject.next(true);
    this.sidebarModeSubject.next('stop');
  }
}
