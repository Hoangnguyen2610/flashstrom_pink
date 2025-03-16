import { Customer } from 'src/customers/entities/customer.entity';
import { Driver } from 'src/drivers/entities/driver.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { v4 as uuidv4 } from 'uuid';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from 'typeorm';
import { CustomerCare } from 'src/customer_cares/entities/customer_care.entity';

@Entity('ratings_reviews')
export class RatingsReview {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  // Reviewer
  @Column({ nullable: true })
  rr_reviewer_driver_id: string;

  @Column({ nullable: true })
  rr_reviewer_customer_id: string;

  @Column({ nullable: true })
  rr_reviewer_restaurant_id: string;

  @Column({ nullable: true })
  rr_reviewer_customercare_id: string;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'rr_reviewer_driver_id' })
  reviewer_driver: Driver;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'rr_reviewer_customer_id' })
  reviewer_customer: Customer;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'rr_reviewer_restaurant_id' })
  reviewer_restaurant: Restaurant;

  @ManyToOne(() => CustomerCare)
  @JoinColumn({ name: 'rr_reviewer_customercare_id' })
  reviewer_customercare: CustomerCare;

  @Column({
    type: 'enum',
    enum: ['driver', 'customer', 'customerCare', 'restaurant']
  })
  reviewer_type: string;

  // Recipient
  @Column({ nullable: true })
  rr_recipient_driver_id: string;

  @Column({ nullable: true })
  rr_recipient_customer_id: string;

  @Column({ nullable: true })
  rr_recipient_restaurant_id: string;

  @Column({ nullable: true })
  rr_recipient_customercare_id: string;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'rr_recipient_driver_id' })
  recipient_driver: Driver;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'rr_recipient_customer_id' })
  recipient_customer: Customer;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'rr_recipient_restaurant_id' })
  recipient_restaurant: Restaurant;

  @ManyToOne(() => CustomerCare)
  @JoinColumn({ name: 'rr_recipient_customercare_id' })
  recipient_customercare: CustomerCare;

  @Column({
    type: 'enum',
    enum: ['driver', 'customer', 'customerCare', 'restaurant']
  })
  recipient_type: string;

  // Order
  @Column()
  order_id: string;

  @ManyToOne(() => Order, order => order.ratings_reviews)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // Các cột khác giữ nguyên
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
