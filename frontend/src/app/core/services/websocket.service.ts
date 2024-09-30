import { Injectable, NgZone } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

class CustomWebSocketSubject<T> extends WebSocketSubject<T> {
  public socket: WebSocket | null = null;

  constructor(
    urlConfigOrSource: string | WebSocketSubjectConfig<T> | Observable<T>
  ) {
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
  private readonly RECONNECT_INTERVAL = 5000;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly HEALTH_CHECK_INTERVAL = 5000;
  private isConnecting = false;

  constructor(private toastr: ToastrService, private ngZone: NgZone) {
    this.connect();
    this.setupHealthCheck();
  }

  private connect(): void {
    if (this.isSocketOpen() || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = window.location.host;

    // find me a better way
    if (!environment.production) {
      host = 'localhost:3000';
    }

    const url = `${protocol}//${host}/ws`;

    this.socket$ = new CustomWebSocketSubject({
      url: url,
      openObserver: {
        next: () => {
          this.reconnectAttempts = 0;
          this.toastr.success('Connected to Bettah Bus');
        },
      },
      closeObserver: {
        next: () => {
          this.toastr.info('Connection closed');
          this.socket$ = null!;
          this.ngZone.run(() => this.attemptReconnect());
        },
      },
    });

    this.isConnecting = false;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.toastr.error('Max reconnect attempts reached.');
      return;
    }

    this.reconnectAttempts++;
    this.toastr.info(
      `Attempting to reconnect: ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} tries`
    );

    timer(this.RECONNECT_INTERVAL).subscribe(() => this.connect());
  }

  private setupHealthCheck(): void {
    timer(this.HEALTH_CHECK_INTERVAL, this.HEALTH_CHECK_INTERVAL).subscribe(
      () => {
        if (!this.isSocketOpen()) {
          this.toastr.info('Disconnected. Attempting to reconnect.');
          this.connect();
        }
      }
    );
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
