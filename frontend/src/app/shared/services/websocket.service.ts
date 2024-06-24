import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket$!: WebSocketSubject<any>;

  constructor() {
    this.connect();
  }

  private connect(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = window.location.host;

    // find me a better way
    if (!environment.production) {
      host = 'localhost:3000';
    }

    const url = `${protocol}//${host}/ws`;
    console.log('ws url = ', url);

    this.socket$ = webSocket({
      url: url,
      // deserializer: defaults to JSON.parse
    });
  }

  // public sendMessage(msg: any): void {
  //   this.socket$.next(msg);
  // }

  public getMessages(): Observable<any> {
    return this.socket$.asObservable();
  }

  public close(): void {
    this.socket$.complete();
  }
}
