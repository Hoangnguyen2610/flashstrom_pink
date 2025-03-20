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
import {
  OrderStatus,
  OrderTrackingInfo
} from 'src/orders/entities/order.entity';
import { WsResponse } from '@nestjs/websockets';
import { OrdersRepository } from 'src/orders/orders.repository';
import { JwtService } from '@nestjs/jwt';

interface AvailableDriver {
  id: string;
  lat: number;
  lng: number;
}

interface RestaurantAcceptData {
  availableDrivers: AvailableDriver[];
  orderDetails: string; // orderId
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
    private readonly ordersRepository: OrdersRepository,
    private readonly jwtService: JwtService
  ) {}

  afterInit() {
    console.log('Restaurant Gateway initialized!');
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

  async handleConnection(client: Socket) {
    console.log('⚡️ Client connected to restaurant namespace:', client.id);
    const restaurantData = await this.validateToken(client);
    if (!restaurantData) return;

    const restaurantId = restaurantData.id; // Giả sử token có field `id`
    if (restaurantId) {
      client.join(`restaurant_${restaurantId}`);
      console.log(
        `Restaurant auto-joined restaurant_${restaurantId} via token`
      );
    }
  }

  handleDisconnect(client: Socket) {
    console.log('❌ Client disconnected from restaurant namespace:', client.id);
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
    const restaurantId = order.restaurant_id;
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
      const fullOrderDetails =
        await this.restaurantsService.getOrderById(orderId);
      if (!fullOrderDetails) {
        return { event: 'error', data: { message: 'Order not found' } };
      }

      // Cập nhật trạng thái đầu tiên
      await this.ordersRepository.update(orderId, {
        status: OrderStatus.RESTAURANT_ACCEPTED,
        tracking_info: OrderTrackingInfo.ORDER_RECEIVED
      });

      const mappedDrivers = availableDrivers.map(item => ({
        id: item.id,
        location: { lat: item.lat, lng: item.lng },
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
        const distance = calculateDistance(
          customer_location?.location?.lat ?? 0,
          customer_location?.location?.lng ?? 0,
          res_location?.location?.lat ?? 0,
          res_location?.location?.lng ?? 0
        );

        // Cập nhật trạng thái thứ hai với dữ liệu thuần
        const updatedFields = {
          distance: +distance,
          status: OrderStatus.PREPARING,
          tracking_info: OrderTrackingInfo.PREPARING,
          driver_wage: FIXED_DELIVERY_DRIVER_WAGE
        };
        console.log('Fields to update:', updatedFields);
        await this.ordersRepository.update(orderId, updatedFields);

        // Lấy dữ liệu order sau khi cập nhật để emit và notify
        const orderWithDistance = await this.ordersRepository.findById(orderId);
        if (!orderWithDistance) {
          throw new Error('Failed to retrieve updated order');
        }

        await this.eventEmitter.emit(
          'order.assignedToDriver',
          orderWithDistance
        );
        await this.notifyPartiesOnce(orderWithDistance);

        return { event: 'orderAssigned', data: orderWithDistance };
      }

      return {
        event: 'noDriver',
        data: { message: 'No suitable driver found' }
      };
    } catch (error) {
      console.error('Error in handleRestaurantAcceptWithDrivers:', error);
      return { event: 'error', data: { message: 'Internal server error' } };
    }
  }

  @SubscribeMessage('restaurantOrderReady')
  async handleRestaurantOrderReady(@MessageBody() data: { orderId: string }) {
    try {
      const { orderId } = data;
      const order = await this.ordersRepository.update(orderId, {
        status: OrderStatus.READY_FOR_PICKUP,
        tracking_info: OrderTrackingInfo.RESTAURANT_PICKUP
      });
      await this.notifyPartiesOnce(order);
      return { event: 'orderReadyForPickup', data: order };
    } catch (error) {
      console.error('Error in handleRestaurantOrderReady:', error);
      return { event: 'error', data: { message: 'Internal server error' } };
    }
  }

  public async notifyPartiesOnce(order: any) {
    const notifyKey = `notify_${order.id}`;
    if (this.notificationLock.get(notifyKey)) return;

    try {
      this.notificationLock.set(notifyKey, true);
      const trackingUpdate = {
        orderDetails: order,
        orderId: order.id,
        order_items: order.order_items,
        status: order.status,
        total_amount: order.total_amount,
        tracking_info: order.tracking_info,
        updated_at: order.updated_at,
        customer_id: order.customer_id,
        driver_id: order.driver_id,
        restaurant_id: order.restaurant_id,
        driver_tips: order.driver_tips || 0 // Thêm driver_tips nếu có
      };
      // Emit qua EventEmitter2 cho customer
      this.eventEmitter.emit('listenUpdateOrderTracking', trackingUpdate);
      // Emit qua EventEmitter2 cho driver
      this.eventEmitter.emit('notifyDriverOrderStatus', trackingUpdate);
      // Chỉ emit trực tiếp cho restaurant trong namespace này
      this.server
        .to(`restaurant_${order.restaurant_id}`)
        .emit('notifyOrderStatus', trackingUpdate);
      console.log(`Emitted notifyOrderStatus for order ${order.id}`);
    } finally {
      this.notificationLock.delete(notifyKey);
    }
  }

  @OnEvent('listenUpdateOrderTracking')
  async handleListenUpdateOrderTracking(@MessageBody() order: any) {
    await this.server
      .to(`restaurant_${order.restaurant_id}`)
      .emit('notifyOrderStatus', {
        orderId: order.orderId,
        status: order.status,
        tracking_info: order.tracking_info,
        updated_at: order.updated_at,
        customer_id: order.customer_id,
        driver_id: order.driver_id,
        restaurant_id: order.restaurant_id,
        driver_tips: order.driver_tips || 0 // Thêm driver_tips
      });
    return {
      event: 'notifyOrderStatus',
      data: order,
      message: `Notified restaurant ${order.restaurant_id}`
    };
  }
}
