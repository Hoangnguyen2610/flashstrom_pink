import {
  Entity,
  Column,
  PrimaryColumn, // Sửa từ Column thành PrimaryColumn
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
  ManyToMany,
  JoinTable,
  ManyToOne
} from 'typeorm';
import { AdminRole, AdminPermission, AdminStatus } from 'src/utils/types/admin';
import { User } from 'src/users/entities/user.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Driver } from 'src/drivers/entities/driver.entity';
import { CustomerCare } from 'src/customer_cares/entities/customer_care.entity';

@Entity('admins')
export class Admin {
  @PrimaryColumn({ type: 'varchar' }) // Sửa thành PrimaryColumn
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user_id: string;

  @Column({
    type: 'enum',
    enum: AdminRole
  })
  role: AdminRole;

  @Column('text', { array: true })
  permissions: AdminPermission[];

  @ManyToMany(() => Restaurant, restaurant => restaurant.admins)
  @JoinTable()
  assigned_restaurants: Restaurant[];

  @ManyToMany(() => Driver, driver => driver.admins)
  @JoinTable()
  assigned_drivers: Driver[];

  @ManyToMany(() => CustomerCare, customerCare => customerCare.admins)
  @JoinTable()
  assigned_customer_care: CustomerCare[];

  @Column({ type: 'bigint', nullable: true })
  last_active: number;

  @CreateDateColumn()
  created_at: number;

  @UpdateDateColumn()
  updated_at: number;

  @ManyToOne(() => Admin, admin => admin.id)
  created_by: Admin;

  @Column({
    type: 'enum',
    enum: AdminStatus,
    default: AdminStatus.ACTIVE
  })
  status: AdminStatus;
}
