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
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
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

      const token = authHeader.slice(7);
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

      const socketRoomId = this.getChatId(
        userData.id,
        data.withUserId,
        data.type
      );

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

      this.activeChats.set(socketRoomId, {
        participants: [userData.id, data.withUserId],
        type: data.type,
        orderId: data.orderId,
        dbRoomId: dbRoom.id
      });

      await client.join(socketRoomId);
      console.log(`Sender ${userData.id} joined room ${socketRoomId}`);

      const recipientSocket = this.userSockets.get(data.withUserId);
      if (recipientSocket) {
        await recipientSocket.join(socketRoomId);
        console.log(`Recipient ${data.withUserId} joined room ${socketRoomId}`);
        recipientSocket.emit('chatStarted', {
          chatId: socketRoomId,
          withUser: userData.id,
          type: data.type,
          dbRoomId: dbRoom.id
        });
      }

      const socketsInRoom = await this.server.in(socketRoomId).allSockets();
      console.log(
        `Active sockets in room ${socketRoomId}:`,
        Array.from(socketsInRoom)
      );

      client.emit('chatStarted', {
        chatId: socketRoomId,
        withUser: data.withUserId,
        type: data.type,
        dbRoomId: dbRoom.id
      });

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
      roomId: string;
      content: string;
      type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'ORDER_INFO';
    }
  ) {
    try {
      const user = client.data.user;

      // Debugging: Log incoming data
      console.log('Received sendMessage data:', data);

      // Fetch room từ database
      const dbRoom = await this.fchatService.getRoomById(data.roomId);
      if (!dbRoom) {
        console.error(`Chat room not found for roomId: ${data.roomId}`);
        throw new WsException('Chat room not found');
      }

      // Kiểm tra participant
      const isParticipant = dbRoom.participants.some(p => p.userId === user.id);
      if (!isParticipant) {
        console.error(
          `User ${user.id} is not a participant in room ${data.roomId}`
        );
        throw new WsException('Unauthorized to send message in this chat');
      }

      // Tạo message trong database
      const dbMessage = await this.fchatService.createMessage({
        roomId: data.roomId,
        senderId: user.id,
        senderType: user.logged_in_as,
        content: data.content,
        messageType: data.type as MessageType,
        readBy: [user.id],
        timestamp: new Date()
      });

      await this.fchatService.updateRoomActivity(data.roomId);

      const message = {
        from: user.id,
        content: data.content,
        type: data.type,
        timestamp: new Date(),
        roomId: data.roomId,
        messageId: dbMessage.id
      };

      // Emit đến tất cả participant (bao gồm sender) một lần duy nhất
      const participants = dbRoom.participants.map(p => p.userId);
      for (const participantId of participants) {
        const participantSocket = this.userSockets.get(participantId);
        if (participantSocket) {
          participantSocket.emit('newMessage', message);
          console.log(`Emitted newMessage to ${participantId}`);
        } else {
          console.log(`Participant ${participantId} is offline`);
        }
      }

      return message;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw new WsException(error.message || 'Failed to send message');
    }
  }

  // Utility function to validate chatId format
  private isValidChatId(chatId: string): boolean {
    // Assuming chatId is in the format: chat_user1_user2_type
    const chatIdRegex = /^chat_[0-9a-zA-Z_]+_[0-9a-zA-Z_]+_(SUPPORT|ORDER)$/; // Adjust regex as needed
    return chatIdRegex.test(chatId);
  }

  @OnEvent('chatHistory')
  handleGetChatHistoryEvent(data: { chatId: string; messages: any[] }) {
    console.log(`Chat history for ${data.chatId}:`, data.messages);
    return data.messages;
  }

  @SubscribeMessage('getChatHistory')
  async handleGetChatHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string } // Đổi từ chatId sang roomId
  ) {
    try {
      const user = client.data.user;
      if (!user) {
        throw new WsException('Unauthorized');
      }

      console.log(
        'User requesting chat history:',
        user.id,
        'for room:',
        data.roomId
      );

      // Kiểm tra xem phòng chat có tồn tại không
      const dbRoom = await this.fchatService.getRoomById(data.roomId);
      if (!dbRoom) {
        console.error(`Chat room not found for roomId: ${data.roomId}`);
        throw new WsException('Chat room not found');
      }

      // Kiểm tra xem user có phải là participant không
      const isParticipant = dbRoom.participants.some(p => p.userId === user.id);
      if (!isParticipant) {
        console.error(
          `User ${user.id} is not a participant in room ${data.roomId}`
        );
        throw new WsException('Unauthorized to access this chat history');
      }

      // Lấy lịch sử tin nhắn từ service
      const messages = await this.fchatService.getRoomMessages(data.roomId);
      if (!messages || messages.length === 0) {
        console.log(`No messages found for room ${data.roomId}`);
      } else {
        console.log(
          `Retrieved ${messages.length} messages for room ${data.roomId}`
        );
      }

      // Gửi lịch sử tin nhắn về client yêu cầu
      client.emit('chatHistory', { roomId: data.roomId, messages });

      return { roomId: data.roomId, messages }; // Trả về để xác nhận
    } catch (error) {
      console.error('Error getting chat history:', error);
      client.emit('error', {
        message: error.message || 'Failed to get chat history'
      });
      return { roomId: data.roomId, messages: [] };
    }
  }

  private isValidChatCombination(
    userType: string,
    chatType: 'ORDER' | 'SUPPORT',
    recipientType: string
  ): boolean {
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
      return (
        validSupportCombinations[userType]?.includes(recipientType) || false
      );
    }

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

  // Helper method to generate socket room ID from database room
  private getSocketRoomIdFromDbRoom(dbRoom: any): string {
    const participants = dbRoom.participants.map(p => p.userId).sort();
    return `chat_${participants.join('_')}_${dbRoom.type}`;
  }

  handleDisconnect(client: Socket) {
    console.log('❌ Client disconnected from chat namespace:', client.id);
    this.userSockets.delete(client.data.user?.id);
    this.fchatService.removeConnection(client.id);
  }

  private getUserType(userId: string): Enum_UserType {
    if (!userId) {
      console.warn('No userId provided');
      return null;
    }

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
