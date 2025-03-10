import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FchatGateway } from './fchat.gateway';
import { FchatService } from './fchat.service';
import { Message } from './entities/message.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { User } from 'src/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { UserRepository } from 'src/users/users.repository';
@Module({
  imports: [TypeOrmModule.forFeature([Message, ChatRoom, User])],
  providers: [
    FchatGateway,
    FchatService,
    JwtService,
    UsersService,
    UserRepository
  ],
  exports: [FchatService]
})
export class FchatModule {}
