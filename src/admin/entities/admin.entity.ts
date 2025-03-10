import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne
} from 'typeorm';
import { AdminRole, AdminPermission, AdminStatus } from 'src/utils/types/admin';
import { User } from 'src/users/entities/user.entity';

@Entity('admins')
export class Admin {
  @Column({ primary: true })
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

  @Column('text', { array: true, nullable: true })
  assigned_restaurants: string[];

  @Column('text', { array: true, nullable: true })
  assigned_drivers: string[];

  @Column('text', { array: true, nullable: true })
  assigned_customer_care: string[];

  @Column({ type: 'bigint', nullable: true })
  last_active: number;

  @CreateDateColumn()
  created_at: number;

  @UpdateDateColumn()
  updated_at: number;

  @Column({ nullable: true })
  created_by: string;

  @Column({
    type: 'enum',
    enum: AdminStatus,
    default: AdminStatus.ACTIVE
  })
  status: AdminStatus;
}
