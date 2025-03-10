import { Injectable } from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Driver } from './entities/driver.entity';
import { createResponse } from 'src/utils/createResponse';
import { ApiResponse } from 'src/utils/createResponse';
import { Type_Delivery_Order } from 'src/types/Driver';
import { calculateDistance } from 'src/utils/distance';
import { AddressBookRepository } from 'src/address_book/address_book.repository';
import { DriversRepository } from './drivers.repository';

@Injectable()
export class DriversService {
  constructor(
    private readonly driversRepository: DriversRepository,
    private readonly addressRepository: AddressBookRepository
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

  // Get all drivers
  async findAll(): Promise<ApiResponse<Driver[]>> {
    try {
      const drivers = await this.driversRepository.findAll();
      return createResponse('OK', drivers, 'Fetched all drivers');
    } catch (error) {
      return this.handleError('Error fetching drivers:', error);
    }
  }

  // Get a driver by ID
  async findDriverById(id: string): Promise<ApiResponse<Driver>> {
    try {
      const driver = await this.driversRepository.findById(id);
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

  // Update a driver by ID
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

  // Delete a driver by ID
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

  // prioritize drivers when app finding driver
  async prioritizeAndAssignDriver(
    listAvailableDrivers: Array<{
      _id: string;
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

      // Temporarily disabled prioritization logic
      // const prioritizedDrivers = this.calculateDriverPriorities(
      //   listAvailableDrivers,
      //   restaurantLocation
      // );

      // Hard-coded to return specific driver only
      const specificDriver = listAvailableDrivers.find(
        driver => driver._id === 'FF_DRI_dfc9f674-e334-4bfc-b639-065c40cb301f'
      );
      const result = specificDriver ? [specificDriver] : [];
      return createResponse('OK', result, 'Driver selected successfully');
    } catch (error) {
      return this.handleError('Error prioritizing drivers:', error);
    }
  }

  async addOrderToDriver(
    driverId: string,
    orderId: string,
    restaurantLocation: { lat: number; lng: number }
  ): Promise<ApiResponse<Driver>> {
    try {
      const driver = await this.driversRepository.findById(driverId);
      if (!driver) {
        return createResponse('NotFound', null, 'Driver not found');
      }

      // Add order to driver's current orders (max 3)
      if (driver.current_order_id.length >= 3) {
        return createResponse(
          'DRIVER_MAXIMUM_ORDER',
          null,
          'Driver already has maximum orders'
        );
      }

      // Calculate active points based on distance
      const points = this.calculateActivePoints(
        driver.current_location?.lat || 10.826411,
        driver.current_location?.lng || 106.617353,
        restaurantLocation.lat || 0,
        restaurantLocation.lng || 0
      );

      // Update driver
      const updatedDriver = await this.driversRepository.update(driverId, {
        current_order_id: [...driver.current_order_id, orderId],
        active_points: driver.active_points + points,
        is_on_delivery: true,
        created_at: driver.created_at,
        updated_at: driver.updated_at,
        last_login: driver.last_login
      });

      return createResponse('OK', updatedDriver, 'Driver updated successfully');
    } catch (error) {
      return this.handleError('Error updating driver:', error);
    }
  }

  async updateDriverDeliveryStatus(
    driverId: string,
    orderId: string,
    status: boolean
  ): Promise<ApiResponse<Driver>> {
    try {
      const driver = await this.driversRepository.findById(driverId);
      if (!driver) {
        return createResponse('NotFound', null, 'Driver not found');
      }

      const updateData: UpdateDriverDto = {
        is_on_delivery: status,
        created_at: driver.created_at,
        updated_at: driver.updated_at,
        last_login: driver.last_login
      };

      if (status) {
        // Adding order to current orders
        updateData.current_order_id = [
          ...(driver.current_order_id || []),
          orderId
        ];
        updateData.active_points = (driver.active_points || 0) + 1;
      } else {
        // Removing order from current orders
        updateData.current_order_id = (driver.current_order_id || []).filter(
          id => id !== orderId
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

  async updateDriverOrder(
    driverId: string,
    orderIds: string[]
  ): Promise<ApiResponse<any>> {
    try {
      const driver = await this.driversRepository.findById(driverId);
      if (!driver) {
        return createResponse('NotFound', null, 'Driver not found');
      }

      const updatedDriver = await this.driversRepository.update(driverId, {
        current_order_id: orderIds,
        is_on_delivery: orderIds.length > 0,
        updated_at: Math.floor(Date.now() / 1000),
        created_at: driver.created_at,
        last_login: driver.last_login
      });

      return createResponse('OK', updatedDriver, 'Driver updated successfully');
    } catch (error) {
      console.error('Error updating driver order:', error);
      return createResponse('ServerError', null, 'Error updating driver order');
    }
  }

  private calculateActivePoints(
    driverLat: number,
    driverLng: number,
    restaurantLat: number,
    restaurantLng: number
  ): number {
    const distance = calculateDistance(
      driverLat,
      driverLng,
      restaurantLat,
      restaurantLng
    );

    if (distance <= 2) return 3;
    if (distance <= 5) return 6;
    return 10;
  }

  // Private helper methods
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
        current_order_id: driver.current_order_id || []
      }))
      .sort((a, b) => this.compareDriverPriorities(a, b));
  }

  private compareDriverPriorities(a: any, b: any): number {
    if (a.distance !== b.distance) return a.distance - b.distance;
    if (a.active_points !== b.active_points)
      return b.active_points - a.active_points;
    return (
      (a.current_order_id?.length || 0) - (b.current_order_id?.length || 0)
    );
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
