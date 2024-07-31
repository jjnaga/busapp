import { Injectable } from '@angular/core';
import { getBaseUrl } from '../utils/utils';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = `${getBaseUrl()}/api/notifications`;
  private PUBLIC_VAPID_KEY =
    'BNI0k4VyKUiy5GmRAupSNFyKz75sJAj-8EW1J7YVbZtUS4eop2qHnBeldnSqn2eUZ3zaQZ5Bi-NFACjFjcLgP30';

  constructor(private httpClient: HttpClient, private toastr: ToastrService) {}

  requestNotification(
    subscription: PushSubscription,
    type: 'bus' | 'stop',
    notificationDate: Date,
    busId?: string,
    stopId?: string
  ): Observable<any> {
    return this.httpClient.post(`${this.apiUrl}/request`, {
      subscription,
      type,
      busId,
      stopId,
      notificationDate,
    });
  }

  async getSubscription(): Promise<PushSubscription> {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      this.toastr.error('Enable Notifications to continue');
    } else {
      this.toastr.info('Notifications enabled');
    }

    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      // If no registration exists, register the service worker
      registration = await navigator.serviceWorker.register('/push-worker.js');
    }

    // Check for existing push subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // If no subscription exists, create a new one
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.PUBLIC_VAPID_KEY),
      });
    }

    return subscription;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
