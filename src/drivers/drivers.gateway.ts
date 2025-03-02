import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit
} from '@nestjs/websockets';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { DriversService } from './drivers.service';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { forwardRef, Inject } from '@nestjs/common';
import { OrdersService } from 'src/orders/orders.service';
import { DriverProgressStagesService } from 'src/driver_progress_stages/driver_progress_stages.service';
// import { UpdateDriverProgressStageDto } from 'src/driver_progress_stages/dto/update-driver-progress-stage.dto';

@WebSocketGateway({
  namespace: 'driver',
  cors: {
    origin: ['*', 'localhost:1310'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket']
})
export class DriversGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly restaurantsService: RestaurantsService,
    @Inject(forwardRef(() => DriversService))
    private readonly driverService: DriversService,
    private eventEmitter: EventEmitter2,
    private readonly ordersService: OrdersService,
    private readonly driverProgressStageService: DriverProgressStagesService
  ) {}

  afterInit() {
    console.log('Driver Gateway initialized');
    // this.server.on('assignOrderToDriver', orderAssignment => {
    //   console.log(
    //     'Received global event for assignOrderToDriver:',
    //     orderAssignment
    //   );
    //   const driverId = orderAssignment.driver_id;
    //   if (driverId) {
    //     this.server
    //       .to(`driver_${driverId}`)
    //       .emit('incomingOrderForDriver', orderAssignment);
    //     console.log(
    //       'Forwarded order assignment to driver:',
    //       driverId,
    //       orderAssignment
    //     );
    //   }
    // });
  }

  @OnEvent('incomingOrderForDriver')
  async handleIncomingOrderForDriver(@MessageBody() order: any) {
    console.log('Received incomingOrderForDriver event:', order);

    // Return the response that will be visible in Postman
    return {
      event: 'incomingOrder',
      data: order,
      message: 'Order received successfully'
    };
  }

  // Handle new driver connections
  handleConnection(client: Socket) {
    console.log(`Driver connected: ${client.id}`);
  }

  // Handle driver disconnections
  handleDisconnect(client: Socket) {
    console.log(`Driver disconnected: ${client.id}`);
  }

  // Handle joining a specific room for the driver
  @SubscribeMessage('joinRoomDriver')
  handleJoinRoom(client: Socket, data: any) {
    const driverId =
      typeof data === 'string' ? data : data?.channel || data?._id || data;

    try {
      client.join(`driver_${driverId}`);
      console.log(`driver_${driverId}`);

      return {
        event: 'joinRoomDriver',
        data: `Joined driver_${driverId}`
      };
    } catch (error) {
      console.error('❌ Error joining room:', error);
      return {
        event: 'error',
        data: 'Failed to join room'
      };
    }
  }

  // Handle updating a driver's information
  @SubscribeMessage('updateDriver')
  async handleUpdateDriver(@MessageBody() updateDriverDto: UpdateDriverDto) {
    const driver = await this.driverService.update(
      updateDriverDto._id,
      updateDriverDto
    );
    this.server.emit('driverUpdated', driver);
    return driver;
  }

  // Handle incoming order notification for drivers
  @SubscribeMessage('newOrderForDriver')
  async handleNewOrder(@MessageBody() order: any) {
    const driverId = order.driver_id; // Removed the 'await' as it's not needed here

    // Notify the specific driver about the new order
    this.server.to(driverId).emit('incomingOrder', order);
    console.log('Emitted incomingOrder event to driver:', driverId, order);

    return order;
  }

  // @SubscribeMessage('assignOrderToDriver')
  // async handleReceiveOrderAssignment(@MessageBody() order: any) {
  //   const driverId = order.driver_id; // Removed the 'await' as it's not needed here

  //   console.log(
  //     'Received assignOrderToDriver event for driver:',
  //     driverId,
  //     order
  //   );

  //   return order;
  // }

  @OnEvent('order.assignedToDriver')
  handleOrderAssignedToDriver(orderAssignment: any) {
    try {
      const driverId = orderAssignment.driver_id;
      if (driverId) {
        this.server
          .to(`driver_${driverId}`)
          .emit('incomingOrderForDriver', orderAssignment);
      }
      return {
        event: 'incomingOrder',
        data: orderAssignment,
        message: 'Order received successfully'
      };
    } catch (error) {
      console.error(
        'Error handling order.assignedToDriver in DriversGateway:',
        error
      );
    }
  }

  @SubscribeMessage('acceptOrder')
  async handleDriverAcceptOrder(
    @MessageBody()
    data: {
      orderId: string;
      driverId: string;
      driverLocation: { lat: number; lng: number };
      restaurantLocation: { lat: number; lng: number };
    }
  ) {
    try {
      console.log('🔍 Driver accept order:', data);

      // Check if driver already has an active progress stage
      const existingStage =
        await this.driverProgressStageService.getActiveStageByDriver(
          data.driverId
        );

      // Check order limit
      if (existingStage.data && existingStage.data.order_ids.length >= 3) {
        return {
          success: false,
          message: 'Driver cannot accept more than 3 orders simultaneously'
        };
      }

      // First update the driver assignment
      await this.ordersService.update(data.orderId, {
        driver_id: data.driverId
      });

      // Then update the status
      const updatedOrder = await this.ordersService.updateOrderStatus(
        data.orderId,
        'IN_PROGRESS'
      );

      if (updatedOrder.EC === 0) {
        const order = updatedOrder.data;
        const updatedDriver = await this.driverService.addOrderToDriver(
          data.driverId,
          order._id as string,
          data.restaurantLocation
        );

        if (updatedDriver.EC === 0) {
          console.log('🔍 Found existing stage:', existingStage);

          // Add 5 more stages for the new order
          const newStages = [
            'driver_ready',
            'waiting_for_pickup',
            'restaurant_pickup',
            'en_route_to_customer',
            'delivery_complete'
          ].map(state => ({
            state,
            status: 'pending' as const,
            timestamp: new Date(),
            duration: 0,
            details: {
              location: this.getLocationForState(state, {
                driverLocation: data.driverLocation,
                restaurantLocation: data.restaurantLocation,
                customerLocation: order.customer_location
              }),
              estimated_time: null,
              actual_time: null,
              notes: null,
              tip: null,
              weather: null
            }
          }));

          if (existingStage.data) {
            const stageId = existingStage.data._id;
            console.log('🔍 Updating existing stage:', stageId);

            // Update the existing stage with new order and stages
            const updateResult =
              await this.driverProgressStageService.updateStage(
                stageId as any,
                {
                  order_ids: [
                    ...existingStage.data.order_ids,
                    order._id as string
                  ],
                  stages: newStages, // Just pass the new stages, let the service handle merging
                  current_state: existingStage.data.current_state
                }
              );

            if (updateResult.EC !== 0) {
              console.error('Failed to update stage:', updateResult);
              return {
                success: false,
                message: 'Failed to update driver progress stage'
              };
            }

            console.log('✅ Stage update result:', updateResult);
          } else {
            // Create new progress stage for first order
            console.log('📝 Creating new stage for first order');
            const createResult = await this.driverProgressStageService.create({
              driver_id: data.driverId,
              order_ids: [order._id as string],
              current_state: 'driver_ready'
            });

            if (createResult.EC !== 0) {
              console.error('Failed to create stage:', createResult);
              return {
                success: false,
                message: 'Failed to create driver progress stage'
              };
            }
          }

          console.log('🔍 Driver accepted order:', updatedDriver.data);
          this.notifyAllParties(order);
          return { success: true, order, driver: updatedDriver.data };
        }
      }
      return { success: false, message: 'Failed to update order or driver' };
    } catch (error) {
      console.error('Error in handleDriverAcceptOrder:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  private getLocationForState(
    state: string,
    locations: {
      driverLocation: { lat: number; lng: number };
      restaurantLocation: { lat: number; lng: number };
      customerLocation: any;
    }
  ) {
    if (state === 'driver_ready') {
      return locations.driverLocation;
    } else if (
      state === 'waiting_for_pickup' ||
      state === 'restaurant_pickup'
    ) {
      return locations.restaurantLocation;
    } else if (
      state === 'en_route_to_customer' ||
      state === 'delivery_complete'
    ) {
      return locations.customerLocation;
    }
    return null;
  }

  @SubscribeMessage('updateDriverProgress')
  async handleDriverProgressUpdate(
    @MessageBody()
    data: {
      stageId: string;
    }
  ) {
    try {
      const stageOrder = [
        'driver_ready',
        'waiting_for_pickup',
        'restaurant_pickup',
        'en_route_to_customer',
        'delivery_complete'
      ];

      // Get the current progress stage
      const currentStage = await this.driverProgressStageService.findById(
        data.stageId
      );
      if (!currentStage.data) {
        return { success: false, message: 'Stage not found' };
      }

      // Find the current in-progress stage
      const currentInProgressStage = currentStage.data.stages.find(
        stage => stage.status === 'in_progress'
      );

      if (!currentInProgressStage) {
        return { success: false, message: 'No in-progress stage found' };
      }

      // Find the next stage
      const nextStage = currentStage.data.stages.find(
        stage =>
          stage.state ===
          stageOrder[stageOrder.indexOf(currentInProgressStage.state) + 1]
      );

      if (!nextStage) {
        return { success: false, message: 'No next stage found' };
      }

      // Update the stages statuses
      const updatedStages = currentStage.data.stages.map(stage => {
        if (stage.state === currentInProgressStage.state) {
          return {
            ...stage,
            status: 'completed',
            duration:
              (new Date().getTime() - new Date(stage.timestamp).getTime()) /
              1000
          };
        }
        if (stage.state === nextStage.state) {
          return {
            ...stage,
            status: 'in_progress',
            timestamp: new Date()
          };
        }
        return stage;
      });

      const result = await this.driverProgressStageService.updateStage(
        data.stageId,
        {
          current_state: nextStage.state as any,
          previous_state: currentInProgressStage.state,
          stages: updatedStages as any
        }
      );

      if (result.EC === 0) {
        this.server
          .to(result.data.driver_id)
          .emit('progressUpdated', result.data);
        return { success: true, stage: result.data };
      }

      return { success: false, message: 'Failed to update progress' };
    } catch (error) {
      console.error('Error in handleDriverProgressUpdate:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  private notifyAllParties(order: any) {
    const restaurantRoom = `restaurant_${order.restaurant_id}`;
    const customerRoom = `customer_${order.customer_id}`;
    const driverRoom = `driver_${order.driver_id}`;

    console.log(`Notifying restaurant room: ${restaurantRoom}`);
    this.server.to(restaurantRoom).emit('orderStatusUpdated', order);

    console.log(`Notifying customer room: ${customerRoom}`);
    this.server.to(customerRoom).emit('orderStatusUpdated', order);

    console.log(`Notifying driver room: ${driverRoom}`);
    this.server.to(driverRoom).emit('orderStatusUpdated', order);
  }
}
