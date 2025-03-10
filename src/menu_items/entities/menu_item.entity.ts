import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { MenuItemVariant } from 'src/menu_item_variants/entities/menu_item_variant.entity';

@Entity('menu_items')
export class MenuItem {
  @PrimaryColumn()
  id: string;

  @Column()
  restaurant_id: string;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @OneToMany(() => MenuItemVariant, variant => variant.menu_item)
  variants: MenuItemVariant[];

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('numeric')
  price: number;

  @Column('text', { array: true })
  category: string[];

  @Column('jsonb', { nullable: true })
  avatar: {
    url: string;
    key: string;
  };

  @Column({ default: false })
  availability: boolean;

  @Column('text', { array: true, default: [] })
  suggest_notes: string[];

  @Column('jsonb', { nullable: true })
  discount: {
    discount_type: 'FIXED' | 'PERCENTAGE';
    discount_value: number;
    start_date: number;
    end_date: number;
  } | null;

  @Column({ default: 0 })
  purchase_count: number;

  @Column({ name: 'created_at' })
  created_at: number;

  @Column({ name: 'updated_at' })
  updated_at: number;

  @BeforeInsert()
  generateId() {
    this.id = `FF_MENU_ITEM_${uuidv4()}`;
    this.created_at = Math.floor(Date.now() / 1000);
    this.updated_at = Math.floor(Date.now() / 1000);
  }
}
