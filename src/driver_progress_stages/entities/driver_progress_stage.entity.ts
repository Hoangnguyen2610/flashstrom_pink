import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  Index,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Driver } from 'src/drivers/entities/driver.entity'; // Import Driver
import { Order } from 'src/orders/entities/order.entity'; // Import Order

@Entity('driver_progress_stages')
@Index(['driver_id', 'current_state'])
export class DriverProgressStage {
  @PrimaryColumn({ type: 'varchar' }) // Thêm type cho chắc
  id: string;

  @Column() // Giữ cột driver_id để lưu giá trị
  @Index()
  driver_id: string;

  @ManyToOne(() => Driver, driver => driver.progress_stages) // Liên kết với Driver
  @JoinColumn({ name: 'driver_id' }) // Trỏ tới cột driver_id
  driver: Driver;

  @ManyToMany(() => Order, order => order.driver_progress_stages) // Liên kết với Order
  @JoinTable({
    name: 'driver_progress_orders', // Tên bảng join
    joinColumn: {
      name: 'driver_progress_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'order_id',
      referencedColumnName: 'id'
    }
  })
  orders: Order[]; // Thay order_ids thành orders

  @Column({ type: 'varchar', nullable: false, default: 'unknown' })
  current_state: string;

  @Column({ nullable: true })
  previous_state: string;

  @Column('jsonb')
  stages: Array<{
    state: string;
    status: 'pending' | 'completed' | 'in_progress' | 'failed';
    timestamp: number;
    duration: number;
    details?: {
      location?: { lat: number; lng: number };
      estimated_time?: number;
      actual_time?: number;
      notes?: string;
      tip?: number;
      weather?: { temperature?: number; condition?: string };
    };
  }>;

  @Column({ nullable: true })
  next_state: string;

  @Column('float', { nullable: true })
  estimated_time_remaining: number;

  @Column('float', { nullable: true })
  actual_time_spent: number;

  @Column('float', { nullable: true })
  total_distance_travelled: number;

  @Column('float', { nullable: true })
  total_tips: number;

  @Column('jsonb')
  events: Array<{
    event_type: 'driver_start' | 'pickup_complete' | 'delivery_complete';
    event_timestamp: Date;
    event_details?: {
      location?: { lat: number; lng: number };
      notes?: string;
    };
  }>;

  @Column()
  created_at: number;

  @Column()
  updated_at: number;

  @BeforeInsert()
  generateId() {
    this.id = `FF_DPS_${uuidv4()}`;
    const now = Math.floor(Date.now() / 1000);
    this.created_at = now;
    this.updated_at = now;
  }
}
