import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DriverProgressStage } from 'src/driver_progress_stages/entities/driver_progress_stage.entity';
import { Driver } from 'src/drivers/entities/driver.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity'; // Import Restaurant
import { AddressBook } from 'src/address_book/entities/address_book.entity'; // Import AddressBook
import { Customer } from 'src/customers/entities/customer.entity';
import { RatingsReview } from 'src/ratings_reviews/entities/ratings_review.entity';

export enum OrderTrackingInfo {
  ORDER_PLACED = 'ORDER_PLACED',
  PREPARING = 'PREPARING',
  RESTAURANT_PICKUP = 'RESTAURANT_PICKUP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  RESTAURANT_ACCEPTED = 'RESTAURANT_ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RESTAURANT_PICKUP = 'RESTAURANT_PICKUP'
}

@Entity('orders')
export class Order {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column()
  customer_id: string;

  @ManyToOne(() => Customer, customer => customer.orders) // Ref tới Customer
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  restaurant_id: string;

  @ManyToOne(() => Restaurant, restaurant => restaurant.orders) // Ref tới Restaurant
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ nullable: true })
  driver_id: string;

  @Column({ nullable: true, type: 'decimal' })
  distance: number;

  @ManyToOne(() => Driver, driver => driver.orders) // Ref tới Driver
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column({
    type: 'enum',
    enum: [
      'PENDING',
      'RESTAURANT_ACCEPTED',
      'IN_PROGRESS',
      'DELIVERED',
      'CANCELLED',
      'RESTAURANT_PICKUP'
    ],
    default: 'PENDING'
  })
  status:
    | 'PENDING'
    | 'RESTAURANT_ACCEPTED'
    | 'IN_PROGRESS'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'RESTAURANT_PICKUP';

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

  @ManyToOne(() => AddressBook, address => address.customer_orders) // Ref tới AddressBook cho customer
  @JoinColumn({ name: 'customer_location' })
  customerAddress: AddressBook;

  @Column()
  restaurant_location: string;

  @ManyToOne(() => AddressBook, address => address.restaurant_orders) // Ref tới AddressBook cho restaurant
  @JoinColumn({ name: 'restaurant_location' })
  restaurantAddress: AddressBook;

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

  @Column({ type: 'bigint' })
  order_time: number;

  @Column({ type: 'bigint' })
  delivery_time: number;

  @Column({
    type: 'enum',
    enum: [
      'ORDER_PLACED',
      'PREPARING',
      'RESTAURANT_PICKUP',
      'OUT_FOR_DELIVERY',
      'DELIVERED'
    ],
    default: 'ORDER_PLACED'
  })
  tracking_info:
    | 'ORDER_PLACED'
    | 'PREPARING'
    | 'RESTAURANT_PICKUP'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED';

  @Column()
  created_at: number;

  @Column()
  updated_at: number;

  @OneToMany(
    () => DriverProgressStage,
    driverProgressStage => driverProgressStage.orders
  )
  driver_progress_stages: DriverProgressStage[];

  @ManyToMany(() => Driver, driver => driver.current_orders)
  drivers: Driver[];

  @OneToMany(() => RatingsReview, ratingReview => ratingReview.order)
  ratings_reviews: RatingsReview[]; // Quan hệ ngược với RatingsReview

  @BeforeInsert()
  generateId() {
    this.id = `FF_ORDER_${uuidv4()}`;
    this.created_at = Math.floor(Date.now() / 1000);
    this.updated_at = Math.floor(Date.now() / 1000);
  }
}
