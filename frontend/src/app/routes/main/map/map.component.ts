import { Component } from '@angular/core';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'map-component',
  templateUrl: './map.component.html',
  standalone: true,
  imports: [GoogleMap, GoogleMapsModule, CommonModule, FontAwesomeModule],
})
export class MapComponent {
  map: google.maps.Map | null = null;
  mapOptions: google.maps.MapOptions = {
    mapId: '53da1ad002655c53',
    center: { lat: 21.3069, lng: -157.8583 },
    zoom: 12,
    // disableDefaultUI: true,
    // zoomControl: true,
    // mapTypeControl: false,
    // streetViewControl: false,
    // fullscreenControl: false,
    // gestureHandling: 'cooperative',
    // scrollwheel: true,
  };

  constructor(private toastrService: ToastrService) {}

  onMapReady(map: google.maps.Map) {
    this.map = map;
    this.map.setOptions(this.mapOptions);
    this.toastrService.success('Map is ready!');

    // if (this.isMobileDevice()) {
    //   this.applyMobileSettings();
    // }
  }
}
