// order.entity.ts
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
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { AddressBook } from 'src/address_book/entities/address_book.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { RatingsReview } from 'src/ratings_reviews/entities/ratings_review.entity';

export enum OrderTrackingInfo {
  ORDER_PLACED = 'ORDER_PLACED', // Đặt hàng
  ORDER_RECEIVED = 'ORDER_RECEIVED', // Đơn hàng đã được tiếp nhận
  PREPARING = 'PREPARING', // Đang chuẩn bị món ăn
  IN_PROGRESS = 'IN_PROGRESS', // Đang tiến hành chuẩn bị
  RESTAURANT_PICKUP = 'RESTAURANT_PICKUP', // Món ăn đã sẵn sàng tại nhà hàng
  DISPATCHED = 'DISPATCHED', // Đơn hàng đã được giao cho tài xế
  EN_ROUTE = 'EN_ROUTE', // Tài xế đang trên đường giao
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', // Đang giao hàng
  DELIVERY_FAILED = 'DELIVERY_FAILED', // Giao hàng thất bại
  DELIVERED = 'DELIVERED', // Giao hàng thành công
  CANCELLED = 'CANCELLED', // Đơn hàng đã bị hủy
  RETURNED = 'RETURNED' // Đơn hàng đã được trả lại
}

export enum OrderStatus {
  PENDING = 'PENDING', // Đơn hàng đang chờ xử lý
  RESTAURANT_ACCEPTED = 'RESTAURANT_ACCEPTED', // Nhà hàng đã nhận đơn
  PREPARING = 'PREPARING', // Nhà hàng bắt đầu chuẩn bị
  IN_PROGRESS = 'IN_PROGRESS', // Đang chuẩn bị
  READY_FOR_PICKUP = 'READY_FOR_PICKUP', // Món ăn sẵn sàng để giao
  RESTAURANT_PICKUP = 'RESTAURANT_PICKUP', // Đã giao cho tài xế
  DISPATCHED = 'DISPATCHED', // Tài xế nhận đơn và chuẩn bị giao
  EN_ROUTE = 'EN_ROUTE', // Tài xế đang trên đường
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', // Đơn hàng đang giao
  DELIVERED = 'DELIVERED', // Giao thành công
  CANCELLED = 'CANCELLED', // Đơn bị hủy
  RETURNED = 'RETURNED', // Đơn bị trả lại
  DELIVERY_FAILED = 'DELIVERY_FAILED' // Giao thất bại
}

@Entity('orders')
export class Order {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column()
  customer_id: string;

  @ManyToOne(() => Customer, customer => customer.orders)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  restaurant_id: string;

  @ManyToOne(() => Restaurant, restaurant => restaurant.orders)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ nullable: true })
  driver_id: string;

  @Column({ nullable: true, type: 'decimal' })
  distance: number;

  @ManyToOne(() => Driver, driver => driver.orders)
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status: OrderStatus;

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

  @ManyToOne(() => AddressBook, address => address.customer_orders)
  @JoinColumn({ name: 'customer_location' })
  customerAddress: AddressBook;

  @Column()
  restaurant_location: string;

  @ManyToOne(() => AddressBook, address => address.restaurant_orders)
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
    enum: OrderTrackingInfo,
    default: OrderTrackingInfo.ORDER_PLACED
  })
  tracking_info: OrderTrackingInfo;

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
  ratings_reviews: RatingsReview[];

  @BeforeInsert()
  generateId() {
    this.id = `FF_ORDER_${uuidv4()}`;
    this.created_at = Math.floor(Date.now() / 1000);
    this.updated_at = Math.floor(Date.now() / 1000);
  }
}
