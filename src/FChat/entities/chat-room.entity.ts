import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Message } from './message.entity';

export enum RoomType {
  SUPPORT = 'SUPPORT',
  ORDER = 'ORDER',
  ADMIN = 'ADMIN' // Thêm nếu cần
}

@Entity('chatrooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.SUPPORT
  })
  type: RoomType;

  @Column('jsonb') // Lưu participants dưới dạng JSON
  participants: { userId: string; userType: string }[];

  @Column({ nullable: true }) // Nếu liên kết với order
  relatedId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActivity: Date;

  @OneToMany(() => Message, message => message.chatRoom)
  messages: Message[];
}
