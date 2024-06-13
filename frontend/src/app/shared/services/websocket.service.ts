import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket$!: WebSocketSubject<any>;

  constructor() {
    this.connect();
  }

  private connect(): void {
    this.socket$ = webSocket({
      url: 'ws://localhost:3000',
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
