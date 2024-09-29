import { Injectable, NgZone } from '@angular/core';
import {
  Observable,
  retry,
  Subject,
  switchMap,
  take,
  takeUntil,
  timer,
} from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket$!: WebSocketSubject<any>;
  private reconnection$: Observable<number>;
  private reconnectAttempts = 0;
  private readonly RECONNECT_INTERVAL = 5000;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly HEALTH_CHECK_INTERVAL = 5000;
  private connecting$ = new Subject<void>();
  private closing$ = new Subject<void>();
  private connectionState: 'connected' | 'connecting' | 'disconnected' =
    'disconnected';

  constructor(private toastr: ToastrService, private ngZone: NgZone) {
    this.reconnection$ = timer(
      this.RECONNECT_INTERVAL,
      this.RECONNECT_INTERVAL
    );
    this.connect();
    this.setupHealthCheck();
  }

  private connect(): void {
    if (this.connectionState !== 'disconnected') {
      return;
    }

    this.connectionState = 'connecting';

    this.connecting$.next();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = window.location.host;

    // find me a better way
    if (!environment.production) {
      host = 'localhost:3000';
    }

    const url = `${protocol}//${host}/ws`;

    this.socket$ = webSocket({
      url: url,
      openObserver: {
        next: () => {
          this.connectionState = 'connected';
          this.toastr.success('Connected to Bettah Bus');
        },
      },
      closeObserver: {
        next: () => {
          this.connectionState = 'disconnected';
          this.toastr.info('Connection closed');
          this.socket$ = null!;
          this.reconnect();
        },
      },
    });
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.toastr.error('Max reconnect attempts reached.');
      return;
    }

    this.ngZone.run(() => {
      this.reconnection$
        .pipe(takeUntil(this.closing$), takeUntil(this.connecting$), take(1))
        .subscribe(() => {
          this.reconnectAttempts++;
          this.toastr.info(
            `Attempting to reconnect: ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} tries`
          );
          this.connect();
        });
    });
  }

  private setupHealthCheck(): void {
    timer(this.HEALTH_CHECK_INTERVAL, this.HEALTH_CHECK_INTERVAL)
      .pipe(
        takeUntil(this.closing$),
        switchMap(() => this.checkConnection())
      )
      .subscribe();
  }

  private checkConnection(): Observable<void> {
    return new Observable<void>((observer) => {
      if (this.connectionState !== 'connected') {
        this.toastr.info('Disconnected. Attempting to reconnect.');
        this.connect();
      }

      observer.next();
      observer.complete();
    });
  }

  // public sendMessage(msg: any): void {
  //   this.socket$.next(msg);
  // }

  public getMessages(): Observable<any> {
    return this.socket$.asObservable();
  }

  public close(): void {
    this.closing$.next();
    this.socket$.complete();
  }
}
