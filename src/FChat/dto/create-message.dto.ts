import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class CreateMessageDto {
  @IsNotEmpty()
  roomId: string;

  @IsNotEmpty()
  senderId: string;

  @IsEnum(MessageType)
  messageType: MessageType;

  @IsString()
  content: string;
}
