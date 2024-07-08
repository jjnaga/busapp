import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { sideBarModes } from '../models/global.model';

@Injectable({ providedIn: 'root' })
export class UserDataService {
  private searchResultSubject = new BehaviorSubject<string>('');
  private sidebarModeSubject = new BehaviorSubject<sideBarModes>(null);
  private showSidebarSubject = new BehaviorSubject<boolean>(false);

  searchResult$ = this.searchResultSubject.asObservable();
  sidebarMode$ = this.sidebarModeSubject.asObservable();
  showSidebar$ = this.showSidebarSubject.asObservable();

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
}
