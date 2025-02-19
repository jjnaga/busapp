import { Injectable } from '@angular/core';
import { Observable, Subscription, timer } from 'rxjs';
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
  private socket$!: CustomWebSocketSubject<any> | null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private isConnecting = false;
  private connectSubscription?: Subscription;

  constructor(private toastr: ToastrService, private store: Store) {}

  connect(): void {
    // If there's an open socket or we're already trying, bail out
    if (
      (this.socket$ && this.socket$.socket && this.socket$.socket.readyState === WebSocket.OPEN) ||
      this.isConnecting
    ) {
      return;
    }
    this.isConnecting = true;
    this.connectSubscription?.unsubscribe();

    const url = `${getBaseUrl(window.location.protocol === 'https:' ? 'wss:' : 'ws:')}/ws`;
    try {
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
            this.socket$ = null; // reset socket reference
            this.attemptReconnect();
          },
        },
      });

      this.connectSubscription = this.socket$.subscribe({
        error: (err) => {
          this.toastr.error(`Socket Error: ${JSON.stringify(err)}`);
          this.isConnecting = false;
          this.socket$ = null;
          this.attemptReconnect();
        },
      });
    } catch (e) {
      console.error(e);
      this.toastr.error(`Error connecting to WS: ${JSON.stringify(e)}`);
      this.isConnecting = false;
      this.socket$ = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.toastr.error('Max reconnect attempts reached.');
      return;
    }
    if (this.isConnecting) {
      return;
    }
    this.reconnectAttempts++;
    // Wait 2 seconds before trying to reconnect
    timer(2000).subscribe(() => this.connect());
  }

  public getMessages(): Observable<any> {
    if (!this.socket$) {
      this.connect();
      // Return an empty observable until the connection is ready
      return new Observable();
    }
    return this.socket$.asObservable();
  }

  public close(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }
}
