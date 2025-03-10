import { Entity, Column, PrimaryColumn, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('customer_cares')
export class CustomerCare {
  @PrimaryColumn()
  id: string;

  @Column()
  user_id: string;

  @Column('jsonb', { nullable: true })
  contact_email: Array<{
    title: string;
    is_default: boolean;
    email: string;
  }>;

  @Column('jsonb', { nullable: true })
  contact_phone: Array<{
    title: string;
    number: string;
    is_default: boolean;
  }>;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column('text', { array: true, nullable: true })
  assigned_tickets: string[];

  @Column()
  created_at: number;

  @Column()
  updated_at: number;

  @Column({ nullable: true })
  last_login: number;

  @Column('jsonb', { nullable: true })
  avatar: {
    key: string;
    url: string;
  };

  @Column({ default: false })
  available_for_work: boolean;

  @Column({ default: false })
  is_assigned: boolean;

  @BeforeInsert()
  generateId() {
    this.id = `FF_CC_${uuidv4()}`;
    const now = Math.floor(Date.now() / 1000);
    this.created_at = now;
    this.updated_at = now;
  }
}
