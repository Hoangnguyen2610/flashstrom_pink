import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/users/entities/user.entity';
import { AddressBook } from 'src/address_book/entities/address_book.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity';
import { Enum_AppTheme } from 'src/types/Payload';
import { Order } from 'src/orders/entities/order.entity';
import { RatingsReview } from 'src/ratings_reviews/entities/ratings_review.entity';

@Entity('customers')
export class Customer {
  @PrimaryColumn()
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column('jsonb', { nullable: true })
  avatar: {
    url: string;
    key: string;
  };

  @ManyToMany(() => AddressBook)
  @JoinTable({
    name: 'customer_addresses',
    joinColumn: {
      name: 'customer_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'address_id',
      referencedColumnName: 'id'
    }
  })
  address: AddressBook[];

  @ManyToMany(() => FoodCategory)
  @JoinTable({
    name: 'customer_preferred_categories',
    joinColumn: {
      name: 'customer_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'category_id',
      referencedColumnName: 'id'
    }
  })
  preferred_category: FoodCategory[];

  @ManyToMany(() => Restaurant)
  @JoinTable({
    name: 'customer_favorite_restaurants',
    joinColumn: {
      name: 'customer_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'restaurant_id',
      referencedColumnName: 'id'
    }
  })
  favorite_restaurants: Restaurant[];

  @Column('text', { array: true, nullable: true })
  favorite_items: string[];

  @Column('text', { array: true, nullable: true })
  support_tickets: string[];

  @Column('jsonb', { nullable: true })
  app_preferences: {
    theme: Enum_AppTheme;
  };

  @Column('jsonb', { nullable: true })
  restaurant_history: {
    restaurant_id: string;
    count: number;
  }[];

  @Column({ name: 'created_at' })
  created_at: number;

  @Column({ name: 'updated_at' })
  updated_at: number;

  @OneToMany(() => Order, order => order.customer)
  orders: Order[]; // Quan hệ ngược với Order

  @OneToMany(() => RatingsReview, ratingReview => ratingReview.customer)
  ratings_reviews: RatingsReview[];

  @BeforeInsert()
  generateId() {
    this.id = `FF_CUS_${uuidv4()}`;
    this.created_at = Math.floor(Date.now() / 1000);
    this.updated_at = Math.floor(Date.now() / 1000);
  }
}
