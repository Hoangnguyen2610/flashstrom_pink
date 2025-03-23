import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CustomersService } from './customers.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: 'customer',
  cors: {
    origin: ['*', process.env.FULL_BACKEND_URL],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket']
})
export class CustomersGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly customersService: CustomersService,
    private readonly jwtService: JwtService,
    private eventEmitter: EventEmitter2
  ) {}

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

  async handleConnection(client: Socket) {
    console.log('⚡️ Client connected to customer namespace:', client.id);
    const customerData = await this.validateToken(client);
    if (!customerData) return;

    const customerId = customerData.id;
    if (customerId) {
      client.join(`customer_${customerId}`);
      console.log(`Customer auto-joined customer_${customerId} via token`);
    }
  }

  @SubscribeMessage('customerPlaceOrder')
  async handleCustomerPlaceOrder(@MessageBody() order: any) {
    const customerId = order.customer_id;
    const trackingUpdate = {
      orderId: order.id,
      status: order.status,
      tracking_info: order.tracking_info,
      updated_at: order.updated_at,
      customer_id: order.customer_id,
      driver_id: order.driver_id,
      restaurant_id: order.restaurant_id
    };
    await this.server
      .to(`customer_${customerId}`)
      .emit('notifyOrderStatus', trackingUpdate);
    console.log('Emitted newOrderForRestaurant via EventEmitter2:', {
      restaurant_id: order.restaurant_id,
      order: trackingUpdate
    });

    return {
      event: 'customerPlaceOrder',
      data: trackingUpdate,
      message: `customerPlaceOrder processed successfully`
    };
  }

  // Bỏ @OnEvent('listenOrderStatusUpdate') vì không cần thiết

  @OnEvent('listenUpdateOrderTracking')
  async handleListenUpdateOrderTracking(@MessageBody() order: any) {
    const trackingUpdate = {
      orderId: order.orderId,
      status: order.status,
      tracking_info: order.tracking_info,
      updated_at: order.updated_at,
      customer_id: order.customer_id,
      driver_id: order.driver_id,
      restaurant_id: order.restaurant_id,
      restaurant_avatar: order.restaurant_avatar,
      driver_avatar: order.driver_avatar
    };
    console.log('check falle here???', order, 'trackingudpate', trackingUpdate);
    await this.server
      .to(`customer_${order.customer_id}`)
      .emit('notifyOrderStatus', trackingUpdate); // Đổi thành notifyOrderStatus
    console.log(`Emitted notifyOrderStatus to customer_${order.customer_id}`);
    return {
      event: 'notifyOrderStatus',
      data: order,
      message: `Notified customer ${order.customer_id}`
    };
  }
}
