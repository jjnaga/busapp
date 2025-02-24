import { Injectable } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GoogleMapsLoaderService {
  private loader: Loader;
  private mapsLoadedSubject = new BehaviorSubject<boolean>(false);
  mapsLoaded$ = this.mapsLoadedSubject.asObservable();

  constructor() {
    this.loader = new Loader({
      apiKey: 'AIzaSyA9g8iSjSM72om8ImdYHvgp_WC2qOljmr0',
      version: 'weekly',
      libraries: ['places', 'geometry', 'marker'],
    });

    // Load immediately when service is created
    this.loader
      .load()
      .then(() => {
        this.mapsLoadedSubject.next(true);
      })
      .catch((err) => {
        console.error('Google Maps failed to load:', err);
        this.mapsLoadedSubject.next(false);
      });
  }
}
