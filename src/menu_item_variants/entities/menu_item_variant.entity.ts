import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MenuItem } from 'src/menu_items/entities/menu_item.entity';

@Entity('menu_item_variants')
export class MenuItemVariant {
  @PrimaryColumn()
  id: string;

  @Column()
  menu_id: string;

  @ManyToOne(() => MenuItem, menuItem => menuItem.variants)
  @JoinColumn({ name: 'menu_id' })
  menu_item: MenuItem;

  @Column()
  variant: string;

  @Column({ nullable: true })
  description: string;

  @Column('jsonb', { nullable: true })
  avatar: {
    key: string;
    url: string;
  };

  @Column({ default: true })
  availability: boolean;

  @Column('text', { array: true, default: [] })
  default_restaurant_notes: string[];

  @Column('numeric')
  price: number;

  @Column('numeric', { nullable: true })
  discount_rate: number;

  @Column({ name: 'created_at' })
  created_at: number;

  @Column({ name: 'updated_at' })
  updated_at: number;

  @BeforeInsert()
  generateId() {
    this.id = `FF_MENU_ITEM_VARIANT_${uuidv4()}`;
    this.created_at = Math.floor(Date.now() / 1000);
    this.updated_at = Math.floor(Date.now() / 1000);
  }
}
