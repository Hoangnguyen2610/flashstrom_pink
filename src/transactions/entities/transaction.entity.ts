import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/users/entities/user.entity';
import { FWallet } from 'src/fwallets/entities/fwallet.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryColumn()
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  fwallet_id: string;

  @ManyToOne(() => FWallet)
  @JoinColumn({ name: 'fwallet_id' })
  fwallet: FWallet;

  @Column({
    type: 'enum',
    enum: ['DEPOSIT', 'WITHDRAW', 'PURCHASE', 'REFUND']
  })
  transaction_type: 'DEPOSIT' | 'WITHDRAW' | 'PURCHASE' | 'REFUND';

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  balance_after: number;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'CANCELLED', 'FAILED', 'COMPLETED'],
    default: 'PENDING'
  })
  status: 'PENDING' | 'CANCELLED' | 'FAILED' | 'COMPLETED';

  @Column()
  timestamp: number;

  @Column({
    type: 'enum',
    enum: ['MOMO', 'FWALLET']
  })
  source: 'MOMO' | 'FWALLET';

  @Column()
  destination: string;

  @Column({
    type: 'enum',
    enum: ['FWALLET', 'TEMPORARY_WALLET_BALANCE'],
    default: 'FWALLET'
  })
  destination_type: 'FWALLET' | 'TEMPORARY_WALLET_BALANCE';

  @Column()
  created_at: number;

  @Column()
  updated_at: number;

  @BeforeInsert()
  generateId() {
    this.id = `FF_TRANSACTION_${uuidv4()}`;
    const now = Math.floor(Date.now() / 1000);
    this.created_at = now;
    this.updated_at = now;
    if (!this.timestamp) {
      this.timestamp = now;
    }
  }
}
