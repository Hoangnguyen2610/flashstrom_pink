import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  OneToMany,
  JoinTable
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/users/entities/user.entity';
import { Admin } from 'src/admin/entities/admin.entity';
import { DriverProgressStage } from 'src/driver_progress_stages/entities/driver_progress_stage.entity';
import { Order } from 'src/orders/entities/order.entity';

@Entity('drivers')
export class Driver {
  @PrimaryColumn({ type: 'varchar' })
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

  @Column('jsonb', { nullable: true })
  contact_email: {
    title: string;
    is_default: boolean;
    email: string;
  }[];

  @Column('jsonb', { nullable: true })
  contact_phone: {
    title: string;
    number: string;
    is_default: boolean;
  }[];

  @Column('jsonb', { nullable: true })
  vehicle: {
    license_plate: string;
    model: string;
    owner: string;
    brand: string;
    year: number;
    color: string;
    images?: { url: string; key: string }[]; // Thêm trường images
  };

  @Column('jsonb', { nullable: true })
  current_location: {
    lat: number;
    lng: number;
  };

  @ManyToMany(() => Order, order => order.drivers)
  @JoinTable({
    name: 'driver_current_orders',
    joinColumn: { name: 'driver_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'order_id', referencedColumnName: 'id' }
  })
  current_orders: Order[];

  @Column('jsonb', { nullable: true })
  rating: {
    average_rating: number;
    review_count: number;
  };

  @Column({ type: 'boolean', default: false })
  available_for_work: boolean;

  @Column({ type: 'boolean', default: false })
  is_on_delivery: boolean;

  @Column({ type: 'int', default: 0 })
  active_points: number;

  @Column({ name: 'created_at' })
  created_at: number;

  @Column({ name: 'updated_at' })
  updated_at: number;

  @Column({ name: 'last_login', nullable: true })
  last_login: number;

  @ManyToMany(() => Admin, admin => admin.assigned_drivers)
  admins: Admin[];

  @OneToMany(() => DriverProgressStage, progressStage => progressStage.driver)
  progress_stages: DriverProgressStage[];

  @OneToMany(() => Order, order => order.driver)
  orders: Order[];

  @BeforeInsert()
  generateId() {
    this.id = `FF_DRI_${uuidv4()}`;
    this.created_at = Math.floor(Date.now() / 1000);
    this.updated_at = Math.floor(Date.now() / 1000);
  }
}
