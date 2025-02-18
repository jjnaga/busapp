import { Injectable } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { ToastrService } from 'ngx-toastr';
import { websocketConnected, websocketDisconnected } from '../state/lib/websocket/websocket.actions';
import { Store } from '@ngrx/store';
import { getBaseUrl } from '../utils/utils';

class CustomWebSocketSubject<T> extends WebSocketSubject<T> {
  public socket: WebSocket | null = null;

  constructor(urlConfigOrSource: string | WebSocketSubjectConfig<T> | Observable<T>) {
    super(urlConfigOrSource);

    const originalConnectSocket = (this as any)._connectSocket.bind(this);
    (this as any)._connectSocket = () => {
      originalConnectSocket();
      this.socket = (this as any)._socket;
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket$!: CustomWebSocketSubject<any>;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private isConnecting = false;
  private connectSubscription?: Subscription; // Add this

  constructor(private toastr: ToastrService, private store: Store) {}

  connect(): void {
    if (this.isSocketOpen() || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Reset connectSubscription if connect() is reran.
      this.connectSubscription?.unsubscribe();

      const url = `${getBaseUrl(window.location.protocol === 'https:' ? 'wss:' : 'ws:')}/ws`;

      this.socket$ = new CustomWebSocketSubject({
        url: url,
        openObserver: {
          next: () => {
            this.store.dispatch(websocketConnected());
            this.isConnecting = false;
            this.reconnectAttempts = 0;
          },
        },
        closeObserver: {
          next: () => {
            this.store.dispatch(websocketDisconnected());
            this.isConnecting = false;
            this.attemptReconnect();
          },
        },
      });

      this.connectSubscription = this.socket$.subscribe({
        error: (err) => {
          this.toastr.error(`Socket Error: ${JSON.stringify(err)}`);
          this.isConnecting = false;
        },
      });

      this.connectSubscription?.add(this.socket$);
    } catch (e) {
      console.error(e);
      this.toastr.error(`Error connecting to WS: ${JSON.stringify(e)}`);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.toastr.error('Max reconnect attempts reached.');
      return;
    }

    // Don't attempt to connect if its already trying to reconnect.
    if (this.isConnecting) {
      return;
    }

    this.reconnectAttempts++;
    // Alert user if multiple reconnect attempts have been attempted
    // AKA: ws comes on and off a lot, soon as app closes it disconnects. don't bother the user until it actually
    // hasn't come back after a few tries.
    if (this.reconnectAttempts > Math.floor(this.MAX_RECONNECT_ATTEMPTS / 2)) {
      this.toastr.info(`Attempting to reconnect: ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} tries`);
    }

    this.connect();
  }

  private isSocketOpen(): boolean {
    return this.socket$?.socket?.readyState === WebSocket.OPEN;
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
