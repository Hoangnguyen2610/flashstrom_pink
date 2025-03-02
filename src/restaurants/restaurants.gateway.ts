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
import { calculateDistance } from 'src/utils/distance';

interface AvailableDriver {
  _id: string;
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
    origin: ['*', 'localhost:1310'],
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

  constructor(
    private readonly restaurantsService: RestaurantsService,
    @Inject(forwardRef(() => DriversService))
    private readonly driverService: DriversService,
    private eventEmitter: EventEmitter2
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
      console.log('✅ Successfully joined room');
      console.log(`restaurant_${restaurantId}`);

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
      updateRestaurantDto._id,
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
  ) {
    const { availableDrivers, orderDetails: orderId } = data;

    // Fetch the full order details using the ID
    const fullOrderDetails =
      await this.restaurantsService.getOrderById(orderId);

    // Update order status to RESTAURANT_ACCEPTED
    await this.restaurantsService.updateOrderStatus(
      orderId,
      'RESTAURANT_ACCEPTED'
    );

    // Map the drivers as before
    const mappedDrivers = availableDrivers.map(item => ({
      _id: item._id,
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
      const res_location = fullOrderDetails.restaurant_location as unknown as {
        location: { lat: number; lng: number };
      };
      // Calculate distance between restaurant and driver
      const distance = calculateDistance(
        selectedDriver.location.lat,
        selectedDriver.location.lng,
        res_location.location.lat,
        res_location.location.lng
      );

      const orderAssignment = {
        ...fullOrderDetails.toObject(),
        driver_id: selectedDriver._id,
        driver_wage: FIXED_DELIVERY_DRIVER_WAGE,
        tracking_info: 'PREPARING',
        status: 'RESTAURANT_ACCEPTED',
        distance: distance // Add the calculated distance
      };

      // Instead of directly emitting to the driver's room, use the event emitter
      this.eventEmitter.emit('order.assignedToDriver', orderAssignment);
      return orderAssignment;
    }

    return { error: 'No suitable driver found' };
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
}
