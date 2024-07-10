import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { sideBarModes } from '../models/global.model';
import { StopsService } from './stops.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserDataService {
  private searchResultSubject = new BehaviorSubject<string>('');
  private sidebarModeSubject = new BehaviorSubject<sideBarModes>(null);
  private showSidebarSubject = new BehaviorSubject<boolean>(false);
  private favoritesSubject = new BehaviorSubject<any[]>([]);

  searchResult$ = this.searchResultSubject.asObservable();
  sidebarMode$ = this.sidebarModeSubject.asObservable();
  // .pipe(tap((sidebar) => console.log('sidebarmode changed', sidebar)));
  showSidebar$ = this.showSidebarSubject.asObservable();
  favorites$ = this.favoritesSubject.asObservable();
  // selectedStop$ = this.selectedStopSubject.asObservable();
  // private selectedStopSubject = new BehaviorSubject<string | null>(null);

  constructor(private stopsService: StopsService) {
    setTimeout(() => {
      console.log('pickign 47');
      this.setSelectedStop('47');
    }, 1000);
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
}
