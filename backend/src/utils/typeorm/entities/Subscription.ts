import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('subscription_pkey', ['id'], { unique: true })
@Entity('subscription', { schema: 'thebus' })
export class Subscription {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column('json', { name: 'subscription' })
  subscription: object;
}
