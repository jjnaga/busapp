// import { Vehicle } from '@typeorm/entities/Vehicle';
// import {
//   EntitySubscriberInterface,
//   EventSubscriber,
//   InsertEvent,
// } from 'typeorm';
// import Redis from 'ioredis';

// @EventSubscriber()
// export class VehicleSubscriber implements EntitySubscriberInterface<Vehicle> {
//   private entities: Vehicle[] = [];
//   private debounceTimeout: NodeJS.Timeout | null = null;
//   private debounceDelay = 50;

//   constructor() {
//     this.publishVehicles = this.publishVehicles.bind(this);

//     console.log(
//       `VehicleSubscriber: Listening and publishing to ${this.publishChannel}`
//     );
//   }

//   listenTo(): typeof Vehicle {
//     return Vehicle;
//   }

//   afterInsert(event: InsertEvent<Vehicle>): void {
//     this.entities.push(event.entity);

//     if (this.debounceTimeout) {
//       console.log('hehe nope!', this.entities.length);
//       clearTimeout(this.debounceTimeout);
//     }
//     this.debounceTimeout = setTimeout(this.publishVehicles, this.debounceDelay);
//   }

//   // TypeORM Upserts also comes as an insert since the update part is internal to Postgres
//   // afterUpdate(event: UpdateEvent<Vehicle>): void {
//   //   this.afterUpsert(event, 'update');
//   // }

//   private publishVehicles(): void {
//     console.log('we made it', this.entities.length);
//     if (this.entities.length > 0) {
//       console.log(
//         `Publshing to ${this.publishChannel}. VehicleCount = ${this.entities.length}`
//       );
//     }

//     this.entities = [];
//   }
// }
