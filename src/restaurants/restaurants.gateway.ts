import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RestaurantsService } from './restaurants.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { DriversService } from 'src/drivers/drivers.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { forwardRef, Inject } from '@nestjs/common';
import { FIXED_DELIVERY_DRIVER_WAGE } from 'src/utils/constants';
import { Type_Delivery_Order } from 'src/types/Driver';
import { calculateDistance } from 'src/utils/commonFunctions';
import { OrderStatus } from 'src/orders/entities/order.entity';
import { OrderTrackingInfo } from 'src/orders/entities/order.entity';
import { WsResponse } from '@nestjs/websockets';
import { OrdersRepository } from 'src/orders/orders.repository';

interface AvailableDriver {
  id: string;
  lat: number;
  lng: number;
}

interface RestaurantAcceptData {
  availableDrivers: AvailableDriver[];
  orderDetails: string;
}

@WebSocketGateway({
  namespace: 'restaurant',
  cors: {
    origin: ['*', process.env.FULL_BACKEND_URL],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket']
})
export class RestaurantsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;
  private notificationLock = new Map<string, boolean>();

  constructor(
    @Inject(forwardRef(() => RestaurantsService))
    private readonly restaurantsService: RestaurantsService,
    @Inject(forwardRef(() => DriversService))
    private readonly driverService: DriversService,
    private eventEmitter: EventEmitter2,
    private readonly ordersRepository: OrdersRepository
  ) {}

  afterInit() {
    console.log('Restaurant Gateway initialized!');
  }

  handleConnection(client: Socket) {
    console.log('⚡️ Client connected to restaurant namespace:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('❌ Client disconnected from restaurant namespace:', client.id);
  }

  @SubscribeMessage('joinRoomRestaurant')
  handleJoinRoom(client: Socket, data: any) {
    const restaurantId =
      typeof data === 'string' ? data : data?.channel || data?._id || data;

    try {
      client.join(`restaurant_${restaurantId}`);
      console.log(`restaurant_${restaurantId} joined`);

      return {
        event: 'joinRoomRestaurant',
        data: `Joined restaurant_${restaurantId}`
      };
    } catch (error) {
      console.error('❌ Error joining room:', error);
      return {
        event: 'error',
        data: 'Failed to join room'
      };
    }
  }

  @SubscribeMessage('updateRestaurant')
  async handleUpdateRestaurant(
    @MessageBody() updateRestaurantDto: UpdateRestaurantDto
  ) {
    const restaurant = await this.restaurantsService.update(
      updateRestaurantDto.id,
      updateRestaurantDto
    );
    this.server.emit('restaurantUpdated', restaurant);
    return restaurant;
  }

  @SubscribeMessage('newOrderForRestaurant')
  async handleNewOrder(@MessageBody() order: any) {
    const restaurantId = await order.restaurant_id;

    // Add this log to verify the room name matches
    console.log('Emitting to room:', `restaurant_${restaurantId}`);

    // Update the room name to match the join format
    await this.server
      .to(`restaurant_${restaurantId}`)
      .emit('incomingOrder', order);

    return order;
  }

  @SubscribeMessage('restaurantAcceptWithAvailableDrivers')
  async handleRestaurantAcceptWithDrivers(
    @MessageBody() data: RestaurantAcceptData
  ): Promise<WsResponse<any>> {
    try {
      const { availableDrivers, orderDetails: orderId } = data;

      // Fetch the full order details using the ID
      const fullOrderDetails =
        await this.restaurantsService.getOrderById(orderId);
      if (!fullOrderDetails) {
        return {
          event: 'error',
          data: { message: 'Order not found' }
        };
      }

      // Update order status
      await this.restaurantsService.updateOrderStatus(
        orderId,
        OrderStatus.RESTAURANT_ACCEPTED
      );

      const mappedDrivers = availableDrivers.map(item => ({
        id: item.id,
        location: {
          lat: item.lat,
          lng: item.lng
        },
        active_points: 0,
        current_order_id: []
      }));

      const responsePrioritizeDrivers =
        await this.driverService.prioritizeAndAssignDriver(
          mappedDrivers,
          fullOrderDetails as unknown as Type_Delivery_Order
        );

      if (
        responsePrioritizeDrivers.EC === 0 &&
        responsePrioritizeDrivers.data.length > 0
      ) {
        const selectedDriver = responsePrioritizeDrivers.data[0];
        const res_location = fullOrderDetails.restaurantAddress as unknown as {
          location: { lat: number; lng: number };
        };
        const customer_location =
          fullOrderDetails.customerAddress as unknown as {
            location: { lat: number; lng: number };
          };
        console.log(
          'check fullorde details',
          fullOrderDetails,
          'driver cus location',
          customer_location?.location,
          'check res location',
          res_location?.location
        );
        const distance = calculateDistance(
          customer_location?.location?.lat ?? 0,
          customer_location?.location?.lng ?? 0,
          res_location?.location?.lat ?? 0,
          res_location?.location?.lng ?? 0
        );

        const orderAssignment = {
          ...fullOrderDetails,
          driver_id: selectedDriver.id,
          driver_wage: FIXED_DELIVERY_DRIVER_WAGE,
          tracking_info: OrderTrackingInfo.PREPARING,
          status: OrderStatus.RESTAURANT_ACCEPTED,
          distance: distance
        };
        const orderWithDistance = await this.ordersRepository.update(orderId, {
          distance: +distance
        });
        console.log('orderAssignment', orderWithDistance);

        await this.notifyPartiesOnce(orderAssignment);

        // Emit only once
        await this.eventEmitter.emit('order.assignedToDriver', orderAssignment);

        return {
          event: 'orderAssigned',
          data: orderAssignment
        };
      }

      return {
        event: 'noDriver',
        data: { message: 'No suitable driver found' }
      };
    } catch (error) {
      console.error('Error in handleRestaurantAcceptWithDrivers:', error);
      return {
        event: 'error',
        data: { message: 'Internal server error' }
      };
    }
  }

  @OnEvent('incomingOrder')
  async handleIncomingOrder(@MessageBody() order: any) {
    console.log('Received incomingOrder event:', order);

    // Return the response that will be visible in Postman
    return {
      event: 'incomingOrder',
      data: order,
      message: 'Order received successfully'
    };
  }

  async emitOrderStatusUpdate(order: any) {
    try {
      // Emit to restaurant room
      this.server
        .to(`restaurant_${order.restaurant_id}`)
        .emit('orderStatusUpdated', order);

      // Emit to customer room if needed
      if (order.customer_id) {
        this.server
          .to(`customer_${order.customer_id}`)
          .emit('orderStatusUpdated', order);
      }

      // Emit to driver room if assigned
      if (order.driver_id) {
        this.server
          .to(`driver_${order.driver_id}`)
          .emit('orderStatusUpdated', order);
      }

      console.log('✅ Order status update emitted successfully');
    } catch (error) {
      console.error('❌ Error emitting order status update:', error);
    }
  }

  @OnEvent('orderTrackingUpdate')
  async handleOrderTrackingUpdate(@MessageBody() order: any) {
    // Return the response that will be visible in Postman
    return {
      event: 'orderTrackingUpdate',
      data: order,
      message: `orderTrackingUpdate: ${order}`
    };
  }
  @OnEvent('listenUpdateOrderTracking')
  async handleListenUpdateOrderTracking(@MessageBody() order: any) {
    await this.server
      .to(`restaurant_${order.restaurant_id}`)
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

  private async notifyPartiesOnce(order: any) {
    const notifyKey = `notify_${order.id}`;

    if (this.notificationLock.get(notifyKey)) {
      return;
    }

    try {
      this.notificationLock.set(notifyKey, true);
      const trackingUpdate = {
        orderId: order.id,
        status: order.status,
        tracking_info: order.tracking_info,
        updated_at: order.updated_at,
        customer_id: order.customer_id,
        driver_id: order.driver_id,
        restaurant_id: order.restaurant_id
      };
      console.log('trackingUpdate', trackingUpdate);
      this.eventEmitter.emit('restaurantPreparingOrder', trackingUpdate);
      console.log(
        `Emitted restaurantPreparingOrder via EventEmitter for order ${order.id}`
      );
    } finally {
      this.notificationLock.delete(notifyKey);
    }
  }
}
