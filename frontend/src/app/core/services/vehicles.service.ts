import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VehiclesService implements OnInit {
  private vehiclesLink = 'http://localhost:3000/vehicles';
  vehicles: any = [];

  constructor(private http: HttpClient) {}

  fetchData(): Observable<any> {
    return this.http.get(this.vehiclesLink);
  }

  ngOnInit(): void {}
}
