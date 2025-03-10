import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Enum_UserType, Enum_AppTheme } from 'src/types/Payload';

@Entity('users')
export class User {
  @Column({ primary: true })
  id: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'integer', nullable: true })
  verification_code: number;

  @Column()
  password: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column('text', { array: true })
  user_type: Enum_UserType[];

  @Column('text', { array: true, nullable: true })
  address: string[];

  @Column({ type: 'jsonb', nullable: true })
  avatar: { url: string; key: string };

  @Column({ default: false })
  is_verified: boolean;

  @Column({ type: 'jsonb', nullable: true })
  app_preferences: { theme: Enum_AppTheme };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;
}
