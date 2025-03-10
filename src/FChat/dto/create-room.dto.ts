import { IsEnum, IsNotEmpty } from 'class-validator';
import { RoomType } from '../entities/chat-room.entity';
import { Enum_UserType } from 'src/types/Payload';
export class CreateRoomDto {
  @IsEnum(RoomType)
  type: RoomType;

  @IsNotEmpty()
  participants: { userId: string; userType: Enum_UserType }[];
}
