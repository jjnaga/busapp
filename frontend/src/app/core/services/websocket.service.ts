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
  private pageVisibilitySubscription?: Subscription;
  private readonly VISIBILITY_RECONNECT_DELAY = 1000; // 1 second

  constructor(private toastr: ToastrService, private store: Store) {
    this.handleVisibilityChange();
  }

  private handleVisibilityChange(): void {
    this.pageVisibilitySubscription?.unsubscribe();

    this.pageVisibilitySubscription = new Observable<boolean>((observer) => {
      const visibilityHandler = () => {
        observer.next(!document.hidden);
      };

      document.addEventListener('visibilitychange', visibilityHandler);
      window.addEventListener('focus', visibilityHandler);
      window.addEventListener('resume', visibilityHandler);

      return () => {
        document.removeEventListener('visibilitychange', visibilityHandler);
        window.removeEventListener('focus', visibilityHandler);
        window.removeEventListener('resume', visibilityHandler);
      };
    }).subscribe((isVisible) => {
      if (isVisible) {
        if (this.socket$ && (!this.socket$.socket || this.socket$.socket.readyState !== WebSocket.OPEN)) {
          this.toastr.info('Page visible, checking connection...');
          this.close();
          timer(this.VISIBILITY_RECONNECT_DELAY).subscribe(() => this.connect());
        }
      } else {
        this.toastr.info('Page hidden, connection may be suspended');
      }
    });
  }

  connect(): void {
    if (
      (this.socket$ && this.socket$.socket && this.socket$.socket.readyState === WebSocket.OPEN) ||
      this.isConnecting
    ) {
      this.toastr.info('WebSocket connection already exists');
      return;
    }

    this.close();

    this.isConnecting = true;
    this.connectSubscription?.unsubscribe();

    const url = `${getBaseUrl(window.location.protocol === 'https:' ? 'wss:' : 'ws:')}/ws`;
    try {
      this.toastr.info('Attempting to connect to WebSocket...');
      this.socket$ = new CustomWebSocketSubject({
        url: url,
        openObserver: {
          next: () => {
            this.store.dispatch(websocketConnected());
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.toastr.success('WebSocket connected successfully');
          },
        },
        closeObserver: {
          next: () => {
            this.store.dispatch(websocketDisconnected());
            this.isConnecting = false;
            this.socket$ = null;
            this.toastr.warning('WebSocket connection closed');
            this.attemptReconnect();
          },
        },
      });

      this.connectSubscription = this.socket$.subscribe({
        error: (err) => {
          this.toastr.error(`WebSocket Error: ${JSON.stringify(err)}`, 'Connection Error');
          this.isConnecting = false;
          this.socket$ = null;
          this.attemptReconnect();
        },
      });
    } catch (e) {
      console.error('WebSocket connection error:', e);
      this.toastr.error('Failed to establish WebSocket connection', 'Connection Error');
      this.isConnecting = false;
      this.socket$ = null;
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.toastr.error('Maximum reconnection attempts reached', 'Connection Failed');
      return;
    }
    if (this.isConnecting) {
      return;
    }
    this.reconnectAttempts++;
    this.toastr.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);
    timer(2000).subscribe(() => this.connect());
  }

  public getMessages(): Observable<any> {
    if (!this.socket$) {
      this.connect();
      return new Observable();
    }
    return this.socket$.asObservable();
  }

  public close(): void {
    if (this.socket$) {
      try {
        this.socket$.complete();
        this.toastr.info('WebSocket connection closed');
      } catch (e) {
        console.warn('Error while closing socket:', e);
        this.toastr.error('Error while closing WebSocket connection');
      }
      this.socket$ = null;
    }
    this.isConnecting = false;
  }

  ngOnDestroy(): void {
    this.pageVisibilitySubscription?.unsubscribe();
    this.connectSubscription?.unsubscribe();
    this.close();
  }
}
