import { Entity, Column, PrimaryColumn, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum OrderTrackingInfo {
  ORDER_PLACED = 'ORDER_PLACED',
  PREPARING = 'PREPARING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  RESTAURANT_ACCEPTED = 'RESTAURANT_ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

@Entity('orders')
export class Order {
  @PrimaryColumn()
  id: string;

  @Column()
  customer_id: string;

  @Column()
  restaurant_id: string;

  @Column({ nullable: true })
  driver_id: string;

  @Column({
    type: 'enum',
    enum: [
      'PENDING',
      'RESTAURANT_ACCEPTED',
      'IN_PROGRESS',
      'DELIVERED',
      'CANCELLED'
    ],
    default: 'PENDING'
  })
  status:
    | 'PENDING'
    | 'RESTAURANT_ACCEPTED'
    | 'IN_PROGRESS'
    | 'DELIVERED'
    | 'CANCELLED';

  @Column('decimal')
  total_amount: number;

  @Column('decimal')
  delivery_fee: number;

  @Column('decimal')
  service_fee: number;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'PAID', 'FAILED'],
    default: 'PENDING'
  })
  payment_status: 'PENDING' | 'PAID' | 'FAILED';

  @Column({
    type: 'enum',
    enum: ['COD', 'FWallet'],
    default: 'FWallet'
  })
  payment_method: 'COD' | 'FWallet';

  @Column()
  customer_location: string;

  @Column()
  restaurant_location: string;

  @Column('jsonb')
  order_items: Array<{
    item_id: string;
    variant_id: string;
    name: string;
    quantity: number;
    price_at_time_of_order: number;
  }>;

  @Column({ nullable: true })
  customer_note: string;

  @Column({ nullable: true })
  restaurant_note: string;

  @Column()
  order_time: number;

  @Column()
  delivery_time: number;

  @Column({
    type: 'enum',
    enum: ['ORDER_PLACED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'],
    default: 'ORDER_PLACED'
  })
  tracking_info:
    | 'ORDER_PLACED'
    | 'PREPARING'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED';

  @Column()
  created_at: number;

  @Column()
  updated_at: number;

  @BeforeInsert()
  generateId() {
    this.id = `FF_ORDER_${uuidv4()}`;
    this.created_at = Math.floor(Date.now() / 1000);
    this.updated_at = Math.floor(Date.now() / 1000);
  }
}
