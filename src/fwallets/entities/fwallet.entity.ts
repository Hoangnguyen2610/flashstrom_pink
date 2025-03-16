import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/users/entities/user.entity'; // Import User

@Entity('fwallets')
export class FWallet {
  @PrimaryColumn({ type: 'varchar' }) // Thêm type cho chắc
  id: string;

  @Column({ nullable: true })
  user_id: string;

  @ManyToOne(() => User, user => user.fwallets) // Quan hệ với User
  @JoinColumn({ name: 'user_id' }) // Trỏ tới cột user_id
  user: User;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ type: 'bigint', default: () => 'EXTRACT(EPOCH FROM NOW())' })
  created_at: number;

  @Column({ type: 'bigint', default: () => 'EXTRACT(EPOCH FROM NOW())' })
  updated_at: number;

  @BeforeInsert()
  generateId() {
    this.id = `F_WALLET_${uuidv4()}`;
    this.created_at = Math.floor(Date.now() / 1000);
    this.updated_at = Math.floor(Date.now() / 1000);
  }
}
