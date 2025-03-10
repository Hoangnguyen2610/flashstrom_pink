import { Entity, Column, PrimaryColumn, BeforeInsert, Index } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('driver_progress_stages')
@Index(['driver_id', 'current_state'])
export class DriverProgressStage {
  @PrimaryColumn()
  id: string;

  @Column()
  @Index()
  driver_id: string;

  @Column('text', { array: true })
  order_ids: string[];

  @Column({
    type: 'enum',
    enum: [
      'driver_ready',
      'waiting_for_pickup',
      'restaurant_pickup',
      'en_route_to_customer',
      'delivery_complete'
    ]
  })
  current_state:
    | 'driver_ready'
    | 'waiting_for_pickup'
    | 'restaurant_pickup'
    | 'en_route_to_customer'
    | 'delivery_complete';

  @Column({ nullable: true })
  previous_state: string;

  @Column('jsonb')
  stages: Array<{
    state: string;
    status: 'pending' | 'completed' | 'in_progress' | 'failed';
    timestamp: number;
    duration: number;
    details?: {
      location?: {
        lat: number;
        lng: number;
      };
      estimated_time?: number;
      actual_time?: number;
      notes?: string;
      tip?: number;
      weather?: {
        temperature?: number;
        condition?: string;
      };
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
      location?: {
        lat: number;
        lng: number;
      };
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
