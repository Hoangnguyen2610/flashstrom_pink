import { Promotion } from 'src/promotions/entities/promotion.entity';
import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  ManyToMany
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('food_categories')
export class FoodCategory {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('jsonb', { nullable: true })
  avatar: {
    url: string;
    key: string;
  };

  @Column({ name: 'created_at' })
  created_at: number;

  @Column({ name: 'updated_at' })
  updated_at: number;

  @ManyToMany(() => Promotion, promotion => promotion.food_categories)
  promotions: Promotion[]; // Quan hệ ngược với Promotion

  @BeforeInsert()
  generateId() {
    this.id = `FF_FC_${uuidv4()}`;
    this.created_at = Math.floor(Date.now() / 1000);
    this.updated_at = Math.floor(Date.now() / 1000);
  }
}
