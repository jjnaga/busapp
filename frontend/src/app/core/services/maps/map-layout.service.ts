import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MapLayoutService {
  private _visibleDrawerHeight = new BehaviorSubject<number>(0);
  visibleDrawerHeight$ = this._visibleDrawerHeight.asObservable();

  updateDrawerHeight(height: number) {
    this._visibleDrawerHeight.next(height);
  }
}
