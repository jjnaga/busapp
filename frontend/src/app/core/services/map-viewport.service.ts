import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectVehicleEntities } from '../state/lib/vehicles/vehicles.selectors';
import { Observable, of } from 'rxjs';
import { map, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MapViewportService {
  private store = inject(Store);

  // Compute a LatLngBounds covering two points.
  computeBounds(pointA: google.maps.LatLngLiteral, pointB: google.maps.LatLngLiteral): google.maps.LatLngBounds {
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(pointA);
    bounds.extend(pointB);
    return bounds;
  }

  // For a given stop, get an observable for the first arrival's bus coordinates.
  getFirstBusCoordinates(selectedStop: any): Observable<google.maps.LatLngLiteral> | null {
    if (!selectedStop || !selectedStop.arrivals || selectedStop.arrivals.length === 0) {
      return null;
    }
    // Assuming arrival.vehicle holds the bus id that matches the key in the vehicle entities.
    const busId = selectedStop.arrivals[0].vehicle;
    return this.store.select(selectVehicleEntities).pipe(
      map((entities) => entities[busId]),
      filter((vehicle) => vehicle !== undefined && !!vehicle.latitude && !!vehicle.longitude),
      map((vehicle) => ({ lat: vehicle!.latitude, lng: vehicle!.longitude }))
    );
  }
}
