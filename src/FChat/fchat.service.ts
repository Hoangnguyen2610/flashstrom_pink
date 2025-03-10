import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class FchatService {
  private connections = new Map<string, User>(); // socketId -> User

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(ChatRoom)
    private roomRepository: Repository<ChatRoom>
  ) {}

  async addConnection(socketId: string, user: User) {
    this.connections.set(socketId, user);
  }

  async removeConnection(socketId: string) {
    this.connections.delete(socketId);
  }

  async getRoomById(roomId: string): Promise<ChatRoom | null> {
    return this.roomRepository.findOne({ where: { id: roomId } });
  }

  async createMessage(messageData: Partial<Message>): Promise<Message> {
    const message = this.messageRepository.create(messageData);
    return this.messageRepository.save(message);
  }

  async createRoom(roomData: Partial<ChatRoom>): Promise<ChatRoom> {
    console.log('check room created', roomData);
    const room = this.roomRepository.create(roomData);
    return this.roomRepository.save(room);
  }

  async getRoomMessages(roomId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { roomId },
      order: { timestamp: 'ASC' }
    });
  }

  async canUserJoinRoom(userId: string, roomId: string): Promise<boolean> {
    try {
      const room = await this.roomRepository.findOne({
        where: { id: roomId },
        relations: ['participants']
      });

      if (!room) {
        return false;
      }

      // Check if user is a participant in the room
      return room.participants.some(
        participant => participant.userId === userId
      );
    } catch (error) {
      console.error('Error checking room access:', error);
      return false;
    }
  }

  async updateRoomActivity(roomId: string): Promise<void> {
    try {
      await this.roomRepository.update(
        { id: roomId },
        { lastActivity: new Date() }
      );
    } catch (error) {
      console.error('Error updating room activity:', error);
      throw error;
    }
  }

  async getActiveChats(userId: string): Promise<ChatRoom[]> {
    return this.roomRepository.find({
      where: {
        participants: {
          userId: userId
        }
      },
      relations: ['participants'],
      order: {
        lastActivity: 'DESC'
      }
    });
  }

  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    try {
      await this.messageRepository
        .createQueryBuilder()
        .update(Message)
        .set({
          readBy: () => `array_append("readBy", '${userId}')`
        })
        .where('roomId = :roomId', { roomId })
        .andWhere('NOT (:userId = ANY(readBy))', { userId })
        .execute();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }
}
