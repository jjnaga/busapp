import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'vehicle-updates',
  templateUrl: './vehicle-updates.component.html',
})
export class VehicleUpdatesComponent implements OnInit, OnDestroy {
  messages: any[] = [];
  private messagesSubscription!: Subscription;

  constructor(private webSocketServices: WebsocketService) {}

  ngOnInit(): void {
    this.messagesSubscription = this.webSocketServices.getMessages().subscribe({
      next: (message) => {
        console.log('message received');
        this.messages.push(message);
      },
      error: (err) => {
        console.error('Error getting message from websocket: ', err);
      },
      complete: () => console.log('Websocket complete'),
    });
  }

  ngOnDestroy(): void {
    this.messagesSubscription.unsubscribe();
    this.webSocketServices.close();
  }
}
