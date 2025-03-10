import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  WsException
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FchatService } from './fchat.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import {
  EventEmitter2
  //  OnEvent
} from '@nestjs/event-emitter';
// import { RoomType } from './entities/chat-room.entity';
// import { CreateRoomDto } from './dto/create-room.dto';
import { Enum_UserType } from 'src/types/Payload';
import { RoomType } from './entities/chat-room.entity';
import { MessageType } from './entities/message.entity';
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: ['*', 'localhost:1310'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket']
})
export class FchatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Socket>();
  private activeChats = new Map<
    string,
    {
      participants: string[];
      type: 'SUPPORT' | 'ORDER' | 'ADMIN';
      orderId?: string;
      dbRoomId: string;
    }
  >();

  constructor(
    private readonly fchatService: FchatService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private eventEmitter: EventEmitter2
  ) {}

  afterInit() {
    console.log('Chat Gateway initialized!');
  }

  private async validateToken(client: Socket): Promise<any> {
    try {
      const authHeader = client.handshake.headers.auth as string;
      if (!authHeader?.startsWith('Bearer ')) {
        client.disconnect();
        return null;
      }

      const token = authHeader.slice(7); // Remove 'Bearer ' prefix
      if (!token) {
        client.disconnect();
        return null;
      }

      const decoded = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET
      });

      return decoded;
    } catch (error) {
      console.error('Token validation error:', error);
      client.disconnect();
      return null;
    }
  }

  @SubscribeMessage('connect')
  async handleConnection(@ConnectedSocket() client: Socket) {
    const userData = await this.validateToken(client);
    if (!userData) return;

    client.data.user = userData;
    this.userSockets.set(userData.id, client);
    await client.join(`user_${userData.id}`);
    // console.log(`User ${userData.id} connected`);
  }

  @SubscribeMessage('startChat')
  async handleStartChat(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      withUserId: string;
      type: 'SUPPORT' | 'ORDER';
      orderId?: string;
    }
  ) {
    try {
      const recipientType = await this.getUserType(data.withUserId);
      const userData = await this.validateToken(client);
      if (!userData) {
        throw new WsException('Unauthorized');
      }

      let user_type;
      switch (userData.logged_in_as) {
        case Enum_UserType.CUSTOMER:
          user_type = Enum_UserType.CUSTOMER;
          break;
        case Enum_UserType.CUSTOMER_CARE_REPRESENTATIVE:
          user_type = Enum_UserType.CUSTOMER_CARE_REPRESENTATIVE;
          break;
        case Enum_UserType.DRIVER:
          user_type = Enum_UserType.DRIVER;
          break;
        case Enum_UserType.RESTAURANT_OWNER:
          user_type = Enum_UserType.RESTAURANT_OWNER;
          break;
        case Enum_UserType.ADMIN:
          user_type = Enum_UserType.ADMIN;
          break;
        default:
          user_type = Enum_UserType.CUSTOMER;
          break;
      }

      if (!this.isValidChatCombination(user_type, data.type, recipientType)) {
        client.emit('error', { message: 'Unauthorized chat type' });
        return;
      }

      // Create socket room ID for real-time communication
      const socketRoomId = this.getChatId(
        userData.id,
        data.withUserId,
        data.type
      );

      // Always create a new database room
      const dbRoom = await this.fchatService.createRoom({
        type: data.type === 'SUPPORT' ? RoomType.SUPPORT : RoomType.ORDER,
        participants: [
          { userId: userData.id, userType: user_type },
          { userId: data.withUserId, userType: recipientType }
        ],
        relatedId: data.orderId,
        createdAt: new Date(),
        lastActivity: new Date()
      });

      // Store the mapping
      this.activeChats.set(socketRoomId, {
        participants: [userData.id, data.withUserId],
        type: data.type,
        orderId: data.orderId,
        dbRoomId: dbRoom.id
      });

      // Join sender to room
      await client.join(socketRoomId);
      console.log(`Sender ${userData.id} joined room ${socketRoomId}`);

      // Join recipient to room
      const recipientSocket = this.userSockets.get(data.withUserId);
      if (recipientSocket) {
        await recipientSocket.join(socketRoomId);
        console.log(`Recipient ${data.withUserId} joined room ${socketRoomId}`);

        // Emit chatStarted to recipient
        recipientSocket.emit('chatStarted', {
          chatId: socketRoomId,
          withUser: userData.id,
          type: data.type,
          dbRoomId: dbRoom.id
        });
      }

      // Double-check room membership
      const socketsInRoom = await this.server.in(socketRoomId).allSockets();
      console.log(
        `Active sockets in room ${socketRoomId}:`,
        Array.from(socketsInRoom)
      );

      // Emit chatStarted to sender
      client.emit('chatStarted', {
        chatId: socketRoomId,
        withUser: data.withUserId,
        type: data.type,
        dbRoomId: dbRoom.id
      });

      // Return the response
      return {
        chatId: socketRoomId,
        dbRoomId: dbRoom.id,
        type: data.type
      };
    } catch (error) {
      console.error('Error in startChat:', error);
      throw new WsException(error.message || 'Failed to start chat');
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      chatId: string;
      content: string;
      type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'ORDER_INFO';
    }
  ) {
    try {
      const user = client.data.user;
      const chat = this.activeChats.get(data.chatId);

      if (!chat || !chat.participants.includes(user.id)) {
        throw new WsException('Chat not found or unauthorized');
      }

      // Ensure sender is in the room
      if (!(await this.server.in(data.chatId).allSockets()).has(client.id)) {
        await client.join(data.chatId);
        console.log(`Rejoined sender ${user.id} to room ${data.chatId}`);
      }

      // Ensure recipient is in the room
      const recipientId = chat.participants.find(id => id !== user.id);
      const recipientSocket = this.userSockets.get(recipientId);
      if (
        recipientSocket &&
        !(await this.server.in(data.chatId).allSockets()).has(
          recipientSocket.id
        )
      ) {
        await recipientSocket.join(data.chatId);
        console.log(`Rejoined recipient ${recipientId} to room ${data.chatId}`);
      }

      // Create message in database
      const dbMessage = await this.fchatService.createMessage({
        roomId: chat.dbRoomId,
        senderId: user.id,
        senderType: user.logged_in_as,
        content: data.content,
        messageType: data.type as MessageType,
        readBy: [user.id],
        timestamp: new Date()
      });

      await this.fchatService.updateRoomActivity(chat.dbRoomId);

      const message = {
        from: user.id,
        content: data.content,
        type: data.type,
        timestamp: new Date(),
        chatId: data.chatId,
        messageId: dbMessage.id
      };

      // Log before emitting
      console.log(`Emitting newMessage to room ${data.chatId}:`, message);

      // Emit to room
      this.server.to(data.chatId).emit('newMessage', message);

      // Double-check by emitting directly to both participants
      chat.participants.forEach(participantId => {
        const socket = this.userSockets.get(participantId);
        if (socket) {
          socket.emit('newMessage', message);
        }
      });

      return message;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw new WsException(error.message || 'Failed to send message');
    }
  }

  @SubscribeMessage('getChatHistory')
  async handleGetChatHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string }
  ) {
    const user = client.data.user;
    const chat = this.activeChats.get(data.chatId);

    if (!chat || !chat.participants.includes(user.id)) {
      client.emit('error', { message: 'Chat not found or unauthorized' });
      return;
    }

    const messages = await this.fchatService.getRoomMessages(data.chatId);
    return messages;
  }

  private isValidChatCombination(
    userType: string,
    chatType: string,
    recipientType: string
  ): boolean {
    // For SUPPORT chats, validate specific combinations
    if (chatType === 'SUPPORT') {
      const validSupportCombinations = {
        CUSTOMER: ['CUSTOMER_CARE_REPRESENTATIVE'],
        DRIVER: ['CUSTOMER_CARE_REPRESENTATIVE'],
        RESTAURANT_OWNER: ['CUSTOMER_CARE_REPRESENTATIVE'],
        CUSTOMER_CARE_REPRESENTATIVE: [
          'CUSTOMER',
          'DRIVER',
          'RESTAURANT_OWNER'
        ],
        ADMIN: [
          'CUSTOMER',
          'DRIVER',
          'RESTAURANT_OWNER',
          'CUSTOMER_CARE_REPRESENTATIVE'
        ]
      };

      // console.log(
      //   'Checking support chat combination:',
      //   `${userType} -> ${recipientType}`,
      //   'Valid recipients for this user:',
      //   validSupportCombinations[userType]
      // );

      return (
        validSupportCombinations[userType]?.includes(recipientType) || false
      );
    }

    // For ORDER chats
    if (chatType === 'ORDER') {
      const validOrderCombinations = {
        CUSTOMER: ['DRIVER', 'RESTAURANT_OWNER'],
        DRIVER: ['CUSTOMER'],
        RESTAURANT_OWNER: ['CUSTOMER'],
        ADMIN: ['CUSTOMER', 'DRIVER', 'RESTAURANT_OWNER']
      };

      return validOrderCombinations[userType]?.includes(recipientType) || false;
    }

    return false;
  }

  private getChatId(user1: string, user2: string, type: string): string {
    return `chat_${[user1, user2].sort().join('_')}_${type}`;
  }

  handleDisconnect(client: Socket) {
    console.log('❌ Client disconnected from chat namespace:', client.id);
    this.userSockets.delete(client.data.user.id);
    this.fchatService.removeConnection(client.id);
  }

  // @SubscribeMessage('createRoom')
  // async handleCreateRoom(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() data: CreateRoomDto
  // ) {
  //   try {
  //     const room = await this.fchatService.createRoom({
  //       type: data.type,
  //       participants: data.participants,
  //       createdAt: new Date(),
  //       lastActivity: new Date()
  //     });

  //     // Create a standardized response
  //     const response = {
  //       event: 'roomCreated',
  //       data: {
  //         roomId: room.id,
  //         type: room.type,
  //         participants: room.participants,
  //         createdAt: room.createdAt,
  //         lastActivity: room.lastActivity
  //       }
  //     };

  //     // Emit to each participant's room
  //     for (const participant of data.participants) {
  //       const userRoom = `chat_${participant.userId}`;
  //       console.log(`Emitting to ${userRoom}`);
  //       this.server.to(userRoom).emit('message', response);
  //     }

  //     // Also emit directly to the creator
  //     client.emit('message', response);

  //     return response;
  //   } catch (error) {
  //     console.error('Error creating room:', error);
  //     const errorResponse = {
  //       event: 'error',
  //       data: 'Failed to create room'
  //     };
  //     client.emit('message', errorResponse);
  //     return errorResponse;
  //   }
  // }

  // @OnEvent('support.requestCreated')
  // async handleSupportRequest(supportData: any) {
  //   try {
  //     const room = await this.fchatService.createRoom({
  //       type: RoomType.SUPPORT,
  //       participants: [supportData.userId, supportData.assignedTo],
  //       relatedId: supportData.requestId
  //     });

  //     // Notify participants
  //     this.server
  //       .to(`user_${supportData.userId}`)
  //       .emit('supportRoomCreated', room);
  //     this.server
  //       .to(`user_${supportData.assignedTo}`)
  //       .emit('supportRoomCreated', room);
  //   } catch (error) {
  //     console.error('Error handling support request:', error);
  //   }
  // }

  // async emitToUser(userId: string, event: string, data: any) {
  //   try {
  //     this.server.to(`user_${userId}`).emit(event, data);
  //     console.log(`✅ Emitted ${event} to user ${userId}`);
  //   } catch (error) {
  //     console.error(`❌ Error emitting ${event} to user ${userId}:`, error);
  //   }
  // }

  private getUserType(userId: string): Enum_UserType {
    // Check if userId exists
    if (!userId) {
      console.warn('No userId provided');
      return null;
    }

    // Check for the full prefix pattern
    if (userId.startsWith('FF_CUS')) {
      return Enum_UserType.CUSTOMER;
    } else if (userId.startsWith('FF_RES')) {
      return Enum_UserType.RESTAURANT_OWNER;
    } else if (userId.startsWith('FF_DRI')) {
      return Enum_UserType.DRIVER;
    } else if (userId.startsWith('FF_CC')) {
      return Enum_UserType.CUSTOMER_CARE_REPRESENTATIVE;
    } else if (userId.startsWith('FF_ADMIN')) {
      return Enum_UserType.ADMIN;
    }

    console.warn(`Unknown user type for userId: ${userId}`);
    return null;
  }
}
