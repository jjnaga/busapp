import { Vehicle } from '@typeorm/entities/Vehicle';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import Redis from 'ioredis';

const redis = new Redis(`${process.env.BULL_HOST}:${process.env.BULL_PORT}`);

@EventSubscriber()
export class VehicleSubscriber implements EntitySubscriberInterface<Vehicle> {
  private publishChannel =
    process.env.REDIS_VEHICLE_PUBLISH_CHANNEL || 'vehicleUpsert';

  constructor() {
    console.log(
      `VehicleSubscriber: Listening and publishing to ${this.publishChannel}`
    );
  }

  listenTo(): typeof Vehicle {
    return Vehicle;
  }

  afterInsert(event: InsertEvent<Vehicle>): void {
    this.afterUpsert(event);
  }

  afterUpdate(event: UpdateEvent<Vehicle>): void {
    this.afterUpsert(event);
  }

  private afterUpsert(
    event: InsertEvent<Vehicle> | UpdateEvent<Vehicle>
  ): void {
    redis.publish(this.publishChannel, JSON.stringify(event.entity));
  }
}
