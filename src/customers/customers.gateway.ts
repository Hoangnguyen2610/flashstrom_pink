import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CustomersService } from './customers.service';
// import { UpdateCustomerDto } from './dto/update-customer.dto';
import { OnEvent } from '@nestjs/event-emitter';

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

  constructor(private readonly customersService: CustomersService) {}

  handleConnection(client: Socket) {
    console.log('⚡️ Client connected to customer namespace:', client.id);
  }
  @SubscribeMessage('joinRoomCustomer')
  handleJoinRoom(client: Socket, data: any) {
    const customerId =
      typeof data === 'string' ? data : data?.channel || data?._id || data;

    try {
      client.join(`customer_${customerId}`);
      console.log(`customer_${customerId} joined`);

      return {
        event: 'joinRoomCustomer',
        data: `Joined customer_${customerId}`
      };
    } catch (error) {
      console.error('❌ Error joining room:', error);
      return {
        event: 'error',
        data: 'Failed to join room'
      };
    }
  }

  @OnEvent('orderTrackingUpdate')
  async handleOrderTrackingUpdate(@MessageBody() order: any) {
    console.log('Received orderTrackingUpdate in customer event:', order);
    // Return the response that will be visible in Postman
    return {
      event: 'orderTrackingUpdate',
      data: order,
      message: `orderTrackingUpdate: ${order}`
    };
  }
  @OnEvent('listenUpdateOrderTracking')
  async handleListenUpdateOrderTracking(@MessageBody() order: any) {
    console.log(
      'Received listenUpdateOrderTracking in customer event to',
      `customer_${order.customer_id}`
    );
    await this.server
      .to(`customer_${order.customer_id}`)
      .emit('orderTrackingUpdate', {
        event: 'orderTrackingUpdate',
        data: order,
        message: 'Order received successfully'
      });
    // Return the response that will be visible in Postman
    return {
      event: 'listenUpdateOrderTracking',
      data: order,
      message: `listenUpdateOrderTracking ${order}`
    };
  }
  @OnEvent('restaurantPreparingOrder')
  async handleListenRestaurantPreparingOrderFromEventEmitter(
    @MessageBody() order: any
  ) {
    await this.server
      .to(`customer_${order.customer_id}`)
      .emit('restaurantPreparingOrder', {
        event: 'restaurantPreparingOrder',
        data: order,
        message: 'Order received successfully'
      });
    // Return the response that will be visible in Postman
    return {
      event: 'restaurantPreparingOrder',
      data: order,
      message: `restaurantPreparingOrder ${order}`
    };
  }

  @OnEvent('restaurantPreparingOrder')
  async handleRestaurantPreparingOrder(@MessageBody() order: any) {
    const trackingUpdate = {
      orderId: order.id,
      status: order.status,
      tracking_info: order.tracking_info,
      updated_at: order.updated_at,
      customer_id: order.customer_id,
      driver_id: order.driver_id,
      restaurant_id: order.restaurant_id
    };
    console.log(
      'Received customerPlaceOrder in customer event:',
      trackingUpdate
    );
    return {
      event: 'customerPlaceOrder',
      data: trackingUpdate,
      message: `customerPlaceOrder: ${order}`
    };
  }

  @SubscribeMessage('customerPlaceOrder')
  async handleCustomerPlaceOrder(@MessageBody() order: any) {
    const customerId = await order.customer_id;

    // Format the tracking update consistently
    const trackingUpdate = {
      orderId: order.id,
      status: order.status,
      tracking_info: order.tracking_info,
      updated_at: order.updated_at,
      customer_id: order.customer_id,
      driver_id: order.driver_id,
      restaurant_id: order.restaurant_id
    };

    // Emit the formatted tracking update
    await this.server
      .to(`customer_${customerId}`)
      .emit('customerPlaceOrder', trackingUpdate);

    console.log(
      'Received customerPlaceOrder in customer event:',
      trackingUpdate
    );

    // Return the formatted tracking update
    return {
      event: 'customerPlaceOrder',
      data: trackingUpdate,
      message: `customerPlaceOrder processed successfully`
    };
  }

  @OnEvent('customerPlaceOrder')
  async handleListenCustomerPlaceOrder(@MessageBody() order: any) {
    // Return the response that will be visible in Postman
    const trackingUpdate = {
      orderId: order.id,
      status: order.status,
      tracking_info: order.tracking_info,
      updated_at: order.updated_at,
      customer_id: order.customer_id,
      driver_id: order.driver_id,
      restaurant_id: order.restaurant_id
    };
    console.log(
      'Received customerPlaceOrder in customer event:',
      trackingUpdate
    );
    return {
      event: 'customerPlaceOrder',
      data: trackingUpdate,
      message: `customerPlaceOrder: ${order}`
    };
  }
}
