import { Entity, Column, PrimaryColumn, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('ratings_reviews')
export class RatingsReview {
  @PrimaryColumn()
  id: string;

  @Column()
  customer_id: string;

  @Column()
  order_id: string;

  @Column()
  restaurant_id: string;

  @Column()
  driver_id: string;

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
