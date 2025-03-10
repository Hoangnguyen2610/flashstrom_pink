import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Enum_UserType } from 'src/types/Payload';

export enum RoomType {
  ORDER = 'ORDER',
  SUPPORT = 'SUPPORT',
  GENERAL = 'GENERAL'
}

@Entity()
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.GENERAL
  })
  type: RoomType;

  @Column({ nullable: true })
  relatedId?: string;

  @Column('jsonb')
  participants: {
    userId: string;
    userType: Enum_UserType;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastActivity: Date;
}
