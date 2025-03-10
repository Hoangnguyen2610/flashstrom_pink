import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PromotionStatus, DiscountType } from '../dto/create-promotion.dto';

@Entity('promotions')
export class Promotion {
  @Column({ primary: true })
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'bigint' })
  start_date: number;

  @Column({ type: 'bigint' })
  end_date: number;

  @Column({
    type: 'enum',
    enum: DiscountType
  })
  discount_type: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount_value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  promotion_cost_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimum_order_value: number;

  @Column({ type: 'jsonb', nullable: true })
  avatar: { url: string; key: string };

  @Column({
    type: 'enum',
    enum: PromotionStatus,
    default: PromotionStatus.PENDING
  })
  status: PromotionStatus;

  @Column('text', { array: true })
  food_categories: string[];

  @Column({ type: 'jsonb', nullable: true })
  bogo_details: {
    buy_quantity: number;
    get_quantity: number;
    max_redemptions?: number;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
