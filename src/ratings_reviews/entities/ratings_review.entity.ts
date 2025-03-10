import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Customer } from 'src/customers/entities/customer.entity'; // Import Customer
import { Order } from 'src/orders/entities/order.entity'; // Import Order
import { Restaurant } from 'src/restaurants/entities/restaurant.entity'; // Import Restaurant
import { Driver } from 'src/drivers/entities/driver.entity'; // Import Driver

@Entity('ratings_reviews')
export class RatingsReview {
  @PrimaryColumn({ type: 'varchar' }) // Thêm type cho chắc
  id: string;

  @Column()
  customer_id: string;

  @ManyToOne(() => Customer, customer => customer.ratings_reviews) // Ref tới Customer
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  order_id: string;

  @ManyToOne(() => Order, order => order.ratings_reviews) // Ref tới Order
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column()
  restaurant_id: string;

  @ManyToOne(() => Restaurant, restaurant => restaurant.ratings_reviews) // Ref tới Restaurant
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column()
  driver_id: string;

  @ManyToOne(() => Driver, driver => driver.ratings_reviews) // Ref tới Driver
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column('int')
  food_rating: number;

  @Column('int')
  delivery_rating: number;

  @Column({ type: 'text', nullable: true })
  food_review: string;

  @Column({ type: 'text', nullable: true })
  delivery_review: string;

  @Column({ type: 'jsonb', nullable: true })
  images: Array<{ url: string; key: string }>;

  @Column()
  created_at: number;

  @Column()
  updated_at: number;

  @BeforeInsert()
  generateId() {
    this.id = `FF_RR_${uuidv4()}`;
    const now = Math.floor(Date.now() / 1000);
    this.created_at = now;
    this.updated_at = now;
  }
}
