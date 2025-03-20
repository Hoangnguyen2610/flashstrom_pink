import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity'; // Import FoodCategory
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

export enum PromotionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED'
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  BOGO = 'BOGO'
}

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

  @ManyToMany(() => FoodCategory, foodCategory => foodCategory.promotions) // Ref tới FoodCategory
  @JoinTable({
    name: 'promotion_food_categories', // Tên bảng join
    joinColumn: {
      name: 'promotion_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'food_category_id',
      referencedColumnName: 'id'
    }
  })
  food_categories: FoodCategory[]; // Đổi từ string[] sang FoodCategory[]

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

  // src/promotions/entities/promotion.entity.ts
  @ManyToMany(() => Restaurant, restaurant => restaurant.promotions)
  restaurants: Restaurant[];
}
