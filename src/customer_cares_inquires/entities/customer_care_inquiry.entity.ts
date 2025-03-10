import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Customer } from 'src/customers/entities/customer.entity';
import { Admin } from 'src/admin/entities/admin.entity';
import { CustomerCare } from 'src/customer_cares/entities/customer_care.entity';
import { Order } from 'src/orders/entities/order.entity';

@Entity('customer_care_inquiries')
export class CustomerCareInquiry {
  @PrimaryColumn({ type: 'varchar' }) // Thêm type cho chắc
  id: string;

  @Column()
  customer_id: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Admin, { nullable: true })
  @JoinColumn({ name: 'assigned_admin_id' }) // Tách riêng cột
  assigned_admin: Admin;

  @ManyToOne(() => CustomerCare, { nullable: true })
  @JoinColumn({ name: 'assigned_customer_care_id' }) // Tách riêng cột
  assigned_customer_care: CustomerCare;

  @Column({
    type: 'enum',
    enum: ['ADMIN', 'CUSTOMER_CARE'],
    default: 'CUSTOMER_CARE'
  })
  assignee_type: 'ADMIN' | 'CUSTOMER_CARE';

  @Column()
  subject: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN'
  })
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

  @Column({
    type: 'enum',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  })
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'text', nullable: true })
  resolution_notes: string;

  @Column()
  created_at: number;

  @Column()
  updated_at: number;

  @Column({ nullable: true })
  resolved_at: number;

  @BeforeInsert()
  generateId() {
    this.id = `FF_INQ_${uuidv4()}`;
    const now = Math.floor(Date.now() / 1000);
    this.created_at = now;
    this.updated_at = now;
  }
}
