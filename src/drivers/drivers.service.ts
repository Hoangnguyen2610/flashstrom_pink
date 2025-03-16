import { Injectable } from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Driver } from './entities/driver.entity';
import { createResponse } from 'src/utils/createResponse';
import { ApiResponse } from 'src/utils/createResponse';
import { Type_Delivery_Order } from 'src/types/Driver';
import { calculateDistance } from 'src/utils/commonFunctions';
import { AddressBookRepository } from 'src/address_book/address_book.repository';
import { DriversRepository } from './drivers.repository';
import { Order } from 'src/orders/entities/order.entity';
import { HARDED_CODE_TEST } from 'src/utils/harded_code_test';
import { OrdersRepository } from 'src/orders/orders.repository';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driversRepository: DriversRepository,
    @InjectRepository(Driver)
    private driverEntityRepository: Repository<Driver>,
    private readonly ordersRepository: OrdersRepository,
    private readonly addressRepository: AddressBookRepository,
    private readonly dataSource: DataSource
  ) {}

  async create(createDriverDto: CreateDriverDto): Promise<ApiResponse<Driver>> {
    try {
      const existingDriver = await this.driversRepository.findByUserId(
        createDriverDto.user_id
      );
      if (existingDriver) {
        return createResponse(
          'DuplicatedRecord',
          null,
          'Driver with this user ID already exists'
        );
      }

      const newDriver = await this.driversRepository.create(createDriverDto);
      return createResponse('OK', newDriver, 'Driver created successfully');
    } catch (error) {
      console.error('Error creating driver:', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while creating the driver'
      );
    }
  }

  async findAll(): Promise<ApiResponse<Driver[]>> {
    try {
      const drivers = await this.driversRepository.findAll();
      return createResponse('OK', drivers, 'Fetched all drivers');
    } catch (error) {
      return this.handleError('Error fetching drivers:', error);
    }
  }

  async findDriverById(
    id: string,
    options?: { relations?: string[] }
  ): Promise<ApiResponse<Driver>> {
    try {
      const driver = await this.driversRepository.findById(id, options);
      return this.handleDriverResponse(driver);
    } catch (error) {
      return this.handleError('Error fetching driver:', error);
    }
  }

  async findOne(conditions: object): Promise<ApiResponse<Driver>> {
    try {
      const driver = await this.driversRepository.findOne(conditions);
      return this.handleDriverResponse(driver);
    } catch (error) {
      return this.handleError('Error fetching driver:', error);
    }
  }

  async update(
    id: string,
    updateDriverDto: UpdateDriverDto
  ): Promise<ApiResponse<Driver>> {
    try {
      const driver = await this.driversRepository.findById(id);
      if (!driver) {
        return createResponse('NotFound', null, 'Driver not found');
      }

      const updatedDriver = await this.driversRepository.update(
        id,
        updateDriverDto
      );
      return createResponse('OK', updatedDriver, 'Driver updated successfully');
    } catch (error) {
      return this.handleError('Error updating driver:', error);
    }
  }

  async setAvailability(id: string): Promise<ApiResponse<Driver>> {
    try {
      const driver = await this.driversRepository.findById(id);
      if (!driver) {
        return createResponse('NotFound', null, 'Driver not found');
      }

      driver.available_for_work = !driver.available_for_work;
      const savedDriver = await this.driversRepository.save(driver);
      return createResponse(
        'OK',
        savedDriver,
        'Driver availability updated successfully'
      );
    } catch (error) {
      return this.handleError('Error updating driver availability:', error);
    }
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      const deletedDriver = await this.driversRepository.remove(id);
      if (!deletedDriver) {
        return createResponse('NotFound', null, 'Driver not found');
      }
      return createResponse('OK', null, 'Driver deleted successfully');
    } catch (error) {
      return this.handleError('Error deleting driver:', error);
    }
  }

  async updateEntityAvatar(
    uploadResult: { url: string; public_id: string },
    entityId: string
  ): Promise<ApiResponse<Driver>> {
    try {
      const driver = await this.driversRepository.findById(entityId);
      if (!driver) {
        return createResponse('NotFound', null, 'Driver not found');
      }

      driver.avatar = { url: uploadResult.url, key: uploadResult.public_id };
      const savedDriver = await this.driversRepository.save(driver);
      return this.handleDriverResponse(savedDriver);
    } catch (error) {
      return this.handleError('Error updating driver avatar:', error);
    }
  }

  async prioritizeAndAssignDriver(
    listAvailableDrivers: Array<{
      id: string;
      location: { lng: number; lat: number };
      active_points?: number;
      current_order_id?: string[];
    }>,
    orderDetails: Type_Delivery_Order
  ): Promise<ApiResponse<any>> {
    try {
      if (!listAvailableDrivers?.length) {
        return createResponse('NoDrivers', [], 'No available drivers found');
      }

      const restaurantLocation = await this.getRestaurantLocation(
        orderDetails.restaurant_location
      );
      if (!restaurantLocation) {
        return createResponse(
          'NotFound',
          null,
          'Restaurant location not found'
        );
      }

      // Tìm driver ưu tiên từ danh sách
      const specificDriver = listAvailableDrivers.find(
        driver => driver.id === HARDED_CODE_TEST.prioritised_drivers[0]
      );
      if (!specificDriver) {
        return createResponse(
          'NotFound',
          [],
          'Prioritized driver not found in available list'
        );
      }

      // Lấy driver từ repository, bao gồm quan hệ current_orders
      const driver = await this.driverEntityRepository.findOne({
        where: { id: specificDriver.id },
        relations: ['current_orders'] // Populate quan hệ current_orders
      });
      if (!driver) {
        return createResponse('NotFound', null, 'Driver not found in database');
      }
      if (driver.current_orders.length > 3) {
        return createResponse(
          'DRIVER_MAXIMUM_ORDER',
          null,
          'Driver has too many current orders'
        );
      }
      console.log('check drivererast', driver);

      // Trả về driver (bao gồm current_orders)
      const driverResult = driver ? [driver] : [];
      return createResponse('OK', driverResult, 'Driver selected successfully');
    } catch (error) {
      return this.handleError('Error prioritizing drivers:', error);
    }
  }

  async updateDriverDeliveryStatus(
    driverId: string,
    orderId: Order['id'],
    status: boolean
  ): Promise<ApiResponse<Driver>> {
    try {
      const driver = await this.driversRepository.findById(driverId, {
        relations: ['current_orders']
      });
      if (!driver) {
        return createResponse('NotFound', null, 'Driver not found');
      }

      const updateData: UpdateDriverDto = {
        is_on_delivery: status,
        created_at: driver.created_at,
        updated_at: Math.floor(Date.now() / 1000),
        last_login: driver.last_login
      };

      if (status) {
        const newOrder = new Order();
        newOrder.id = orderId;
        updateData.current_orders = [
          ...(driver.current_orders || []),
          newOrder
        ];
        updateData.active_points = (driver.active_points || 0) + 1;
      } else {
        updateData.current_orders = (driver.current_orders || []).filter(
          order => order.id !== orderId
        );
      }

      const updatedDriver = await this.driversRepository.update(
        driverId,
        updateData
      );
      return createResponse(
        'OK',
        updatedDriver,
        'Driver status updated successfully'
      );
    } catch (error) {
      console.error('Error updating driver delivery status:', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while updating driver status'
      );
    }
  }

  async updateDriverOrder(driverId: string, orderIds: string[]): Promise<void> {
    const driver = await this.driversRepository.findById(driverId, {
      relations: ['current_orders']
    });
    if (driver) {
      const orders = await Promise.all(
        orderIds.map(id => this.ordersRepository.findById(id))
      );
      driver.current_orders = orders.filter(order => order !== null);
      await this.driversRepository.save(driver);
    }
  }

  async addOrderToDriver(
    driverId: string,
    orderId: string,
    restaurantLocation: { lat: number; lng: number },
    transactionalEntityManager?: EntityManager
  ): Promise<ApiResponse<Driver>> {
    try {
      console.log(
        'Starting addOrderToDriver with driverId:',
        driverId,
        'orderId:',
        orderId
      );
      const startTime = Date.now();

      const manager = transactionalEntityManager || this.dataSource.manager;

      // Fetch driver một lần duy nhất
      console.log('addOrderToDriver - Fetching driver: START');
      const driver = await manager.findOne(Driver, {
        where: { id: driverId },
        relations: ['user']
      });
      console.log(
        'addOrderToDriver - Fetching driver: END, Time:',
        Date.now() - startTime,
        'ms'
      );
      if (!driver) {
        return createResponse('NotFound', null, 'Driver not found');
      }

      // Tính điểm và khoảng cách
      console.log('addOrderToDriver - Calculating points and distance: START');
      const driverLat = driver.current_location?.lat || 10.826411;
      const driverLng = driver.current_location?.lng || 106.617353;
      const restLat = restaurantLocation.lat || 0;
      const restLng = restaurantLocation.lng || 0;

      const points = this.calculateActivePoints(
        driverLat,
        driverLng,
        restLat,
        restLng
      );
      const distance = calculateDistance(
        driverLat,
        driverLng,
        restLat,
        restLng
      );
      console.log(
        'addOrderToDriver - Calculating points and distance: END, Points:',
        points,
        'Distance:',
        distance,
        'Time:',
        Date.now() - startTime,
        'ms'
      );

      // Cập nhật driver
      console.log('addOrderToDriver - Updating driver: START');
      driver.active_points = (driver.active_points || 0) + points;
      driver.is_on_delivery = true;
      driver.updated_at = Math.floor(Date.now() / 1000);
      await manager.save(Driver, driver);
      console.log(
        'addOrderToDriver - Updating driver: END, Time:',
        Date.now() - startTime,
        'ms'
      );

      // Cập nhật order distance
      if (distance) {
        console.log('addOrderToDriver - Updating order distance: START');
        await manager
          .createQueryBuilder()
          .update(Order)
          .set({ distance: distance.toString() })
          .where('id = :id', { id: orderId })
          .execute();
        console.log(
          'addOrderToDriver - Updating order distance: END, Time:',
          Date.now() - startTime,
          'ms'
        );
      }

      console.log(
        'addOrderToDriver - Complete, Total Time:',
        Date.now() - startTime,
        'ms'
      );
      return createResponse('OK', driver, 'Driver updated successfully');
    } catch (error) {
      console.error('Error in addOrderToDriver:', error);
      return this.handleError('Error updating driver:', error);
    }
  }

  // Giả sử các hàm helper
  private calculateActivePoints(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    // Logic đơn giản, có thể tối ưu dựa trên khoảng cách
    const distance = calculateDistance(lat1, lng1, lat2, lng2);
    return distance > 10000 ? 20 : 10; // Ví dụ: 10 điểm nếu < 10km, 20 nếu > 10km
  }

  private handleDriverResponse(driver: Driver | null): ApiResponse<Driver> {
    if (!driver) {
      return createResponse('NotFound', null, 'Driver not found');
    }
    return createResponse('OK', driver, 'Driver retrieved successfully');
  }

  private async getRestaurantLocation(
    location: { lat: number; lng: number } | string
  ): Promise<any> {
    if (typeof location === 'string') {
      const response = await this.addressRepository.findById(location);
      return response ? response.location : null;
    }
    return location;
  }

  private calculateDriverPriorities(
    drivers: any[],
    restaurantLocation: any
  ): any[] {
    return drivers
      .map(driver => ({
        ...driver,
        distance: calculateDistance(
          driver.location.lat,
          driver.location.lng,
          restaurantLocation.lat,
          restaurantLocation.lng
        ),
        active_points: driver.active_points || 0,
        current_orders: driver.current_orders || []
      }))
      .sort((a, b) => this.compareDriverPriorities(a, b));
  }

  private compareDriverPriorities(a: any, b: any): number {
    if (a.distance !== b.distance) return a.distance - b.distance;
    if (a.active_points !== b.active_points)
      return b.active_points - a.active_points;
    return (a.current_orders?.length || 0) - (b.current_orders?.length || 0);
  }

  private handleError(message: string, error: any): ApiResponse<null> {
    console.error(message, error);
    return createResponse(
      'ServerError',
      null,
      'An error occurred while processing your request'
    );
  }
}
