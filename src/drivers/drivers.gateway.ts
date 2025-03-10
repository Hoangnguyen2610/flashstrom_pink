import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException
} from '@nestjs/websockets';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { DriversService } from './drivers.service';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { forwardRef, Inject } from '@nestjs/common';
import { OrdersService } from 'src/orders/orders.service';
import { DriverProgressStagesService } from 'src/driver_progress_stages/driver_progress_stages.service';
import {
  Order,
  OrderStatus,
  OrderTrackingInfo
} from 'src/orders/entities/order.entity';
import { DataSource, Not } from 'typeorm'; // Loại bỏ import IsolationLevel
import { DriverProgressStage } from 'src/driver_progress_stages/entities/driver_progress_stage.entity';
import { Driver } from './entities/driver.entity';
// import { createResponse } from 'src/utils/createResponse';
import { AddressBookRepository } from 'src/address_book/address_book.repository';
import { DriversRepository } from './drivers.repository';
import { SemaphoreService } from 'src/semaphor/semaphore.service';

@WebSocketGateway({
  namespace: 'driver',
  cors: {
    origin: ['*', process.env.FULL_BACKEND_URL],
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
  private driverSockets: Map<string, Set<string>> = new Map();
  private processingOrders: Map<string, boolean> = new Map();
  private notificationLock = new Map<string, boolean>();
  private activeConnections = new Map<string, Socket>();
  private dpsCreationLocks = new Set<string>();
  private requestQueue: Map<string, Promise<void>> = new Map();

  constructor(
    private readonly restaurantsService: RestaurantsService,
    @Inject(forwardRef(() => DriversService))
    private readonly driverService: DriversService,
    private readonly driverRepository: DriversRepository,
    private eventEmitter: EventEmitter2,
    private readonly ordersService: OrdersService,
    private readonly driverProgressStageService: DriverProgressStagesService,
    private readonly dataSource: DataSource,
    private readonly addressBookRepository: AddressBookRepository
  ) {}

  afterInit() {
    console.log('Driver Gateway initialized');
  }

  @OnEvent('incomingOrderForDriver')
  async handleIncomingOrderForDriver(@MessageBody() order: any) {
    console.log('Received incomingOrderForDriver event:', order);
    return {
      event: 'incomingOrder',
      data: order,
      message: 'Order received successfully'
    };
  }

  handleConnection(client: Socket) {
    const driverId = client.handshake.query.driverId as string;
    if (driverId) {
      this.cleanupDriverConnections(driverId);
    }
    this.activeConnections.set(client.id, client);
  }

  private cleanupDriverConnections(driverId: string) {
    for (const [id, socket] of this.activeConnections.entries()) {
      if (socket.handshake.query.driverId === driverId) {
        socket.disconnect();
        this.activeConnections.delete(id);
      }
    }
    this.processingOrders.clear();
    this.dpsCreationLocks.clear();
    this.notificationLock.clear();
  }

  handleDisconnect(client: Socket) {
    console.log(`Driver disconnected: ${client.id}`);
    const driverId = client.handshake.query.driverId as string;
    this.activeConnections.delete(client.id);
    if (driverId) {
      this.processingOrders.delete(`${driverId}_*`);
      this.dpsCreationLocks.delete(driverId);
    }
  }

  @SubscribeMessage('joinRoomDriver')
  handleJoinRoom(client: Socket, data: any) {
    const driverId =
      typeof data === 'string' ? data : data?.channel || data?._id || data;

    try {
      if (!this.driverSockets.has(driverId)) {
        this.driverSockets.set(driverId, new Set());
      }
      this.driverSockets.get(driverId)?.add(client.id);

      client.join(`driver_${driverId}`);
      console.log(`Driver joined driver_${driverId}`);

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

  @SubscribeMessage('updateDriver')
  async handleUpdateDriver(@MessageBody() updateDriverDto: UpdateDriverDto) {
    const driver = await this.driverService.update(
      updateDriverDto.id,
      updateDriverDto
    );
    this.server.emit('driverUpdated', driver);
    return driver;
  }

  @SubscribeMessage('newOrderForDriver')
  async handleNewOrder(@MessageBody() order: any) {
    const driverId = order.driver_id;
    this.server.to(driverId).emit('incomingOrder', order);
    console.log('Emitted incomingOrder event to driver:', driverId, order);
    return order;
  }

  @OnEvent('order.assignedToDriver')
  async handleOrderAssignedToDriver(orderAssignment: any) {
    try {
      const driverId = orderAssignment.driver_id;

      if (!driverId) {
        throw new WsException('Driver ID is required');
      }

      await this.server
        .to(`driver_${driverId}`)
        .emit('incomingOrderForDriver', {
          event: 'incomingOrder',
          data: orderAssignment,
          message: 'Order received successfully'
        });

      return {
        event: 'orderAssigned',
        data: { success: true }
      };
    } catch (error) {
      console.error('Error handling order.assignedToDriver:', error);
      if (error instanceof WsException) {
        throw error;
      }
      throw new WsException('Internal server error');
    }
  }

  @SubscribeMessage('driverAcceptOrder')
  async handleDriverAcceptOrder(@MessageBody() data: any) {
    const { driverId, orderId } = data;
    console.log(
      `Starting handleDriverAcceptOrder for driverId: ${driverId}, orderId: ${orderId}`
    );

    const lockKey = `${driverId}_${orderId}`;
    console.log(`Lock key generated: ${lockKey}`);

    // Kiểm tra xem order đã được xử lý chưa
    if (this.processingOrders.get(lockKey)) {
      console.log(`Order already being processed for ${lockKey}`);
      return { success: false, message: 'Order is already being processed' };
    }

    this.processingOrders.set(lockKey, true);
    console.log(`Processing lock set for ${lockKey}`);

    const lockTimeout: NodeJS.Timeout | null = setTimeout(() => {
      console.log(`Lock timeout expired for ${lockKey}, attempting rollback`);
      this.processingOrders.delete(lockKey);
      this.dpsCreationLocks.delete(lockKey);
    }, 15000); // 15 giây timeout

    try {
      // Sử dụng semaphore toàn cục cho orderId
      const semaphore = SemaphoreService.getInstance().getSemaphore(orderId);
      await semaphore.acquire();
      console.log(`Semaphore acquired for orderId: ${orderId}`);

      // Cơ chế retry
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.dataSource.transaction(
            async transactionalEntityManager => {
              // Đặt mức cô lập transaction cao nhất
              await transactionalEntityManager.query(
                'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE'
              );
              console.log(
                `Transaction started (Attempt ${attempt}) for driverId: ${driverId}, orderId: ${orderId}`
              );

              // Lock order ngay từ đầu với pessimistic_write
              console.log(`Locking order with id: ${orderId}`);
              const lockedOrder = await transactionalEntityManager
                .createQueryBuilder(Order, 'order')
                .setLock('pessimistic_write')
                .where('order.id = :id', { id: orderId })
                .getOne();
              if (!lockedOrder) {
                throw new WsException('Order not found');
              }
              console.log(`Order locked: ${lockedOrder.id}`);

              // Kiểm tra driver_id của order
              if (lockedOrder.driver_id) {
                throw new WsException('Order is already assigned to a driver');
              }

              // Kiểm tra existingOrderDPS
              console.log(`Checking existingOrderDPS for orderId: ${orderId}`);
              const existingOrderDPS = await transactionalEntityManager
                .createQueryBuilder()
                .select('dpo')
                .from('driver_progress_orders', 'dpo')
                .where('dpo.order_id = :orderId', { orderId })
                .getRawOne();
              if (existingOrderDPS) {
                throw new WsException(
                  'Order is already assigned to another DPS'
                );
              }

              // Kiểm tra DPS của driver
              console.log(`Checking existing DPS for driverId: ${driverId}`);
              const existingDPS = await transactionalEntityManager
                .getRepository(DriverProgressStage)
                .findOne({
                  where: {
                    driver_id: driverId,
                    current_state: Not('delivery_complete')
                  }
                });
              if (existingDPS) {
                throw new WsException('Driver already has an active delivery');
              }

              // Fetch driver
              console.log(`Fetching driver with id: ${driverId}`);
              const driver = await transactionalEntityManager
                .getRepository(Driver)
                .findOne({ where: { id: driverId } });
              if (!driver) {
                throw new WsException('Driver not found');
              }
              console.log(`Driver fetched: ${driver.id}`);

              // Tạo DPS
              console.log(
                `Creating DPS for driverId: ${driverId}, orderId: ${orderId}`
              );
              const dps = await this.driverProgressStageService.create(
                {
                  driver_id: driverId,
                  orders: [lockedOrder],
                  current_state: 'driver_ready'
                },
                transactionalEntityManager
              );
              console.log(`DPS created: ${dps.data.id}`);

              // Cập nhật order
              console.log(
                `Updating order with driver_id and status: ${orderId}`
              );
              await this.ordersService.update(
                orderId,
                { driver_id: driverId, status: OrderStatus.IN_PROGRESS },
                transactionalEntityManager
              );
              lockedOrder.drivers = lockedOrder.drivers || [];
              if (!lockedOrder.drivers.some(d => d.id === driverId)) {
                lockedOrder.drivers.push(driver);
              }
              await transactionalEntityManager.save(Order, lockedOrder);
              console.log(`Updated Order with driver relation: ${orderId}`);

              // Cập nhật trạng thái order
              console.log(`Updating order status: ${orderId}`);
              const orderWithStatus =
                await this.ordersService.updateOrderStatus(
                  orderId,
                  OrderStatus.IN_PROGRESS,
                  transactionalEntityManager
                );

              // Lấy thông tin restaurant location
              const restaurantLocation =
                await this.addressBookRepository.findById(
                  orderWithStatus.data.restaurant_location
                );
              if (!restaurantLocation) {
                throw new WsException('Restaurant location not found');
              }

              // Gán order cho driver
              console.log(
                `Adding order to driver: ${driverId}, order: ${orderId}`
              );
              await this.driverService.addOrderToDriver(
                driverId,
                orderId,
                restaurantLocation.location as any,
                transactionalEntityManager
              );
              this.notifyPartiesOnce(orderWithStatus.data);
              return { success: true, dps: dps.data };
            }
          );
          return result; // Thành công, thoát vòng retry
        } catch (error) {
          if (attempt === maxRetries) {
            console.error(`Max retries reached for ${lockKey}:`, error);
            throw error;
          }
          console.warn(
            `Retry ${attempt}/${maxRetries} for ${lockKey} due to:`,
            error.message
          );
          await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
        }
      }
    } catch (error) {
      console.error('Error in handleDriverAcceptOrder:', error);
      return {
        success: false,
        message: error.message || 'Internal server error'
      };
    } finally {
      if (lockTimeout) {
        clearTimeout(lockTimeout);
      }
      this.processingOrders.delete(lockKey);
      this.dpsCreationLocks.delete(lockKey);
      if (SemaphoreService.getInstance().getSemaphore(orderId).acquire()) {
        SemaphoreService.getInstance().getSemaphore(orderId).release();
        console.log(`Semaphore released for orderId: ${orderId}`);
      }
      console.log(`Locks released for ${lockKey}`);
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
      console.log('check locations.driverLocation', locations.driverLocation);
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
  async handleDriverProgressUpdate(@MessageBody() data: { stageId: string }) {
    try {
      const result = await this.dataSource.transaction(
        async transactionalEntityManager => {
          const dps = await transactionalEntityManager
            .getRepository(DriverProgressStage)
            .findOne({
              where: { id: data.stageId },
              relations: ['orders']
            });

          if (!dps) {
            return { success: false, message: 'Stage not found' };
          }

          const timestamp = Math.floor(Date.now() / 1000);
          const stageOrder = [
            'driver_ready',
            'waiting_for_pickup',
            'restaurant_pickup',
            'en_route_to_customer',
            'delivery_complete'
          ];

          const currentStage = dps.stages.find(s => s.status === 'in_progress');
          if (!currentStage) {
            return { success: false, message: 'No in-progress stage found' };
          }

          const nextState =
            stageOrder[stageOrder.indexOf(currentStage.state) + 1];
          if (!nextState) {
            return { success: false, message: 'Already at final stage' };
          }

          const updatedStages = dps.stages.map(stage => {
            if (stage.state === currentStage.state) {
              return {
                ...stage,
                status: 'completed',
                duration: timestamp - stage.timestamp
              };
            }
            if (stage.state === nextState) {
              return { ...stage, status: 'in_progress', timestamp };
            }
            return stage;
          });

          const updateResult =
            await this.driverProgressStageService.updateStage(data.stageId, {
              current_state: nextState as any,
              stages: updatedStages as any
            });

          let updatedOrder = null;
          if (nextState === 'delivery_complete') {
            const orderId = dps.orders?.[0]?.id;
            if (!orderId) {
              console.warn(`No order found for DPS ${data.stageId}`);
              return {
                success: false,
                message: 'No order associated with this stage'
              };
            }

            await transactionalEntityManager
              .createQueryBuilder()
              .delete()
              .from('driver_current_orders')
              .where('driver_id = :driverId', { driverId: dps.driver_id })
              .andWhere('order_id = :orderId', { orderId })
              .execute();

            console.log(
              `Removed order ${orderId} from driver ${dps.driver_id}'s current_orders`
            );

            await this.ordersService.updateOrderStatus(
              orderId,
              OrderStatus.DELIVERED
            );

            updatedOrder = await this.ordersService.findOne(orderId);
            if (
              updatedOrder.data.status !== OrderStatus.DELIVERED ||
              updatedOrder.data.tracking_info !== OrderTrackingInfo.DELIVERED
            ) {
              console.error(
                'Failed to update order status or tracking_info correctly:',
                updatedOrder
              );
            }
          } else {
            const orderId = dps.orders?.[0]?.id;
            if (orderId) {
              updatedOrder = await this.ordersService.findOne(orderId);
            }
          }

          console.log('check next state', nextState);
          console.log('check updatedOrder', updatedOrder.data, updatedOrder);

          if (updatedOrder?.data) {
            await this.notifyPartiesOnce(updatedOrder.data);
            console.log(
              `Notified parties about progress update for order ${updatedOrder.data.id}`
            );
          }

          return { success: true, stage: updateResult.data };
        }
      );

      return result;
    } catch (error) {
      console.error('Error in handleDriverProgressUpdate:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  private async notifyPartiesOnce(order: Order) {
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

      this.eventEmitter.emit('listenUpdateOrderTracking', trackingUpdate);
      console.log(
        `Emitted listenUpdateOrderTracking via EventEmitter for order ${order.id}`
      );
    } finally {
      this.notificationLock.delete(notifyKey);
    }
  }

  @OnEvent('orderTrackingUpdate')
  async handleOrderTrackingUpdate(@MessageBody() order: any) {
    return {
      event: 'orderTrackingUpdate',
      data: order,
      message: `orderTrackingUpdate: ${order}`
    };
  }

  @OnEvent('listenUpdateOrderTracking')
  async handleListenUpdateOrderTracking(@MessageBody() order: any) {
    await this.server
      .to(`driver_${order.driver_id}`)
      .emit('orderTrackingUpdate', {
        event: 'orderTrackingUpdate',
        data: order,
        message: 'Order received successfully'
      });
    return {
      event: 'listenUpdateOrderTracking',
      data: order,
      message: `listenUpdateOrderTracking ${order}`
    };
  }
}
