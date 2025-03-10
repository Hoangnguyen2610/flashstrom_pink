import { Entity, Column, PrimaryColumn, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('cart_items')
export class CartItem {
  @PrimaryColumn()
  id: string;

  @Column()
  customer_id: string;

  @Column()
  item_id: string;

  @Column()
  restaurant_id: string;

  @Column('jsonb')
  variants: Array<{
    variant_id: string;
    variant_name: string;
    variant_price_at_time_of_addition: number;
    quantity: number;
  }>;

  @Column()
  created_at: number;

  @Column()
  updated_at: number;

  @BeforeInsert()
  generateId() {
    this.id = `FF_CART_ITEM_${uuidv4()}`;
    const now = Math.floor(Date.now() / 1000);
    this.created_at = now;
    this.updated_at = now;
  }
}
