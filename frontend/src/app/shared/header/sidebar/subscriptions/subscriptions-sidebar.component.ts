import { Component, OnInit } from '@angular/core';
import {
  OwlDateTimeModule,
  OwlNativeDateTimeModule,
} from '@danielmoncada/angular-datetime-picker';
import { UserDataService } from '../../../../core/services/user-data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../../core/services/notification.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { StopsService } from '../../../../core/services/stops.service';
import { SelectedStop } from '../../../../core/utils/global.types';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'subscriptions-sidebar',
  imports: [
    CommonModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    FormsModule,
  ],
  templateUrl: './subscriptions-sidebar.component.html',
  standalone: true,
})
export class SubscriptionsSidebarComponent implements OnInit {
  private subscriptions: Subscription = new Subscription();
  newSubscription$ = this.userDataService.newSubscription$;
  selectedFrequency: string = 'oneTime';
  weekDays: string[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  selectedDays: string[] = [];
  selectedStop: SelectedStop = undefined;
  selectedDate: Date = new Date();

  constructor(
    private userDataService: UserDataService,
    private notificationService: NotificationService,
    private stopsService: StopsService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.stopsService.selectedStop$.subscribe(
        (selectedStop) => (this.selectedStop = selectedStop)
      )
    );
  }

  onDayChange(event: any) {
    if (event.target.checked) {
      this.selectedDays.push(event.target.value);
    } else {
      this.selectedDays = this.selectedDays.filter(
        (day) => day !== event.target.value
      );
    }
  }

  async enableNotifications() {
    try {
      const subscription = await this.notificationService.getSubscription();

      // TODO: only for stop right now need to build to support both types
      const response = firstValueFrom(
        await this.notificationService.requestNotification(
          subscription,
          'stop',
          this.selectedDate,
          undefined,
          this.selectedStop!.stopId
        )
      );

      console.log('nah', response);

      this.toastr.success('Subscribed');
    } catch (err) {
      console.error('Failed to enable notifications', err);
      this.toastr.error('Subscribe failed');
    }
  }
}
