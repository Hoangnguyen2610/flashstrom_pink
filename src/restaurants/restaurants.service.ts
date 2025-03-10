import { Injectable } from '@nestjs/common';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { createResponse } from 'src/utils/createResponse';
import { MenuItemsService } from 'src/menu_items/menu_items.service';
import { CreateMenuItemDto } from 'src/menu_items/dto/create-menu_item.dto';
import { UpdateMenuItemDto } from 'src/menu_items/dto/update-menu_item.dto';
import { CreateMenuItemVariantDto } from 'src/menu_item_variants/dto/create-menu_item_variant.dto';
import { MenuItemVariantsService } from 'src/menu_item_variants/menu_item_variants.service';
import { UpdateMenuItemVariantDto } from 'src/menu_item_variants/dto/update-menu_item_variant.dto';
import { UserRepository } from 'src/users/users.repository';
import { ApiResponse } from 'src/utils/createResponse';
import { PromotionsRepository } from 'src/promotions/promotions.repository';
import { AddressBookRepository } from 'src/address_book/address_book.repository';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantsRepository } from './restaurants.repository';
import { OrdersRepository } from 'src/orders/orders.repository';
import { RestaurantsGateway } from 'src/restaurants/restaurants.gateway';
import { OrderStatus } from 'src/orders/entities/order.entity';

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly restaurantsRepository: RestaurantsRepository,
    private readonly userRepository: UserRepository,
    private readonly promotionRepository: PromotionsRepository,
    private readonly addressRepository: AddressBookRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly menuItemsService: MenuItemsService,
    private readonly menuItemVariantsService: MenuItemVariantsService,
    private readonly restaurantsGateway: RestaurantsGateway
  ) {}

  async create(
    createRestaurantDto: CreateRestaurantDto
  ): Promise<ApiResponse<Restaurant>> {
    try {
      const { owner_id, promotions, address_id } = createRestaurantDto;

      // Check if owner exists using repository pattern
      const owner = await this.userRepository.findById(owner_id);
      if (!owner) {
        return createResponse('NotFound', null, 'Owner not found');
      }

      // Check if address exists
      const addressBookEntry =
        await this.addressRepository.findById(address_id);
      if (!addressBookEntry) {
        return createResponse(
          'NotFound',
          null,
          'Address not found in address book'
        );
      }

      // Check if promotions exist using repository
      if (promotions) {
        const foundPromotions =
          await this.promotionRepository.findByIds(promotions);
        if (foundPromotions.length !== promotions.length) {
          return createResponse(
            'NotFound',
            null,
            'One or more promotions not found'
          );
        }
      }

      const savedRestaurant =
        await this.restaurantsRepository.create(createRestaurantDto);

      return createResponse(
        'OK',
        savedRestaurant,
        'Restaurant created successfully'
      );
    } catch (error) {
      console.error('Error creating restaurant:', error);
      return createResponse('ServerError', null, 'Error creating restaurant');
    }
  }

  async update(
    id: string,
    updateRestaurantDto: UpdateRestaurantDto
  ): Promise<ApiResponse<Restaurant>> {
    try {
      const { owner_id, promotions, address_id } = updateRestaurantDto;

      // Check if restaurant exists
      const existingRestaurant = await this.restaurantsRepository.findById(id);
      if (!existingRestaurant) {
        return createResponse('NotFound', null, 'Restaurant not found');
      }

      // Check if owner exists
      if (owner_id) {
        const owner = await this.userRepository.findById(owner_id);
        if (!owner) {
          return createResponse('NotFound', null, 'Owner not found');
        }
      }

      // Check if address exists
      if (address_id) {
        const addressBookEntry =
          await this.addressRepository.findById(address_id);
        if (!addressBookEntry) {
          return createResponse(
            'NotFound',
            null,
            'Address not found in address book'
          );
        }
      }

      // Check if promotions exist
      if (promotions) {
        const foundPromotions =
          await this.promotionRepository.findByIds(promotions);
        if (foundPromotions.length !== promotions.length) {
          return createResponse(
            'NotFound',
            null,
            'One or more promotions not found'
          );
        }
      }

      const updatedRestaurant = await this.restaurantsRepository.update(
        id,
        updateRestaurantDto
      );

      return createResponse(
        'OK',
        updatedRestaurant,
        'Restaurant updated successfully'
      );
    } catch (error) {
      console.error('Error updating restaurant:', error);
      return createResponse('ServerError', null, 'Error updating restaurant');
    }
  }

  async updateEntityAvatar(
    uploadResult: { url: string; public_id: string },
    entityId: string
  ) {
    const restaurant = await this.restaurantsRepository.update(entityId, {
      avatar: { url: uploadResult.url, key: uploadResult.public_id }
    });

    if (!restaurant) {
      return createResponse('NotFound', null, 'Restaurant not found');
    }

    return createResponse(
      'OK',
      restaurant,
      'Restaurant avatar updated successfully'
    );
  }

  // Menu Item Methods
  async createMenuItemForRestaurant(
    restaurantId: string,
    createMenuItemDto: CreateMenuItemDto
  ): Promise<any> {
    return this.menuItemsService.create({
      ...createMenuItemDto,
      restaurant_id: restaurantId
    });
  }

  async updateMenuItemForRestaurant(
    restaurantId: string,
    menuItemId: string,
    updateMenuItemDto: UpdateMenuItemDto
  ): Promise<any> {
    const menuItem = await this.menuItemsService.findOne(menuItemId);

    if (menuItem.data.menuItem.restaurant_id !== restaurantId) {
      return createResponse(
        'Forbidden',
        null,
        'Menu Item does not belong to this restaurant'
      );
    }

    return this.menuItemsService.update(menuItemId, {
      ...updateMenuItemDto,
      restaurant_id: restaurantId
    });
  }

  async deleteMenuItemForRestaurant(
    restaurantId: string,
    menuItemId: string
  ): Promise<any> {
    const menuItem = await this.menuItemsService.findOne(menuItemId);

    if (menuItem.data.restaurant_id !== restaurantId) {
      return createResponse(
        'Forbidden',
        null,
        'Menu Item does not belong to this restaurant'
      );
    }

    return this.menuItemsService.remove(menuItemId);
  }

  async getMenuItemsForRestaurant(restaurantId: string): Promise<any> {
    const allMenuItems = await this.menuItemsService.findAll();
    const restaurantMenuItems = allMenuItems.data.filter(
      item => item.restaurant_id.toString() === restaurantId
    );

    return createResponse(
      'OK',
      restaurantMenuItems,
      'Fetched menu items for the restaurant'
    );
  }

  // Menu Item Variant Methods
  async createMenuItemVariantForRestaurant(
    menuId: string,
    createMenuItemVariantDto: CreateMenuItemVariantDto
  ): Promise<any> {
    return this.menuItemVariantsService.create({
      ...createMenuItemVariantDto,
      menu_id: menuId
    });
  }

  async updateMenuItemVariantForRestaurant(
    variantId: string,
    updateMenuItemVariantDto: UpdateMenuItemVariantDto
  ): Promise<any> {
    return this.menuItemVariantsService.update(
      variantId,
      updateMenuItemVariantDto
    );
  }

  async deleteMenuItemVariantForRestaurant(
    menuItemVariantId: string
  ): Promise<any> {
    return this.menuItemVariantsService.remove(menuItemVariantId);
  }

  async getOrderById(orderId: string) {
    return this.ordersRepository.findById(orderId);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    try {
      // Define tracking info based on status
      // const tracking_info =
      //   status === 'RESTAURANT_ACCEPTED' ? 'PREPARING' : status;

      // Use the OrdersRepository updateStatus method
      const updatedOrder = await this.ordersRepository.updateStatus(
        orderId,
        status as OrderStatus
      );

      if (!updatedOrder) {
        return createResponse('NotFound', null, 'Order not found');
      }

      // Emit socket event if needed
      if (this.restaurantsGateway) {
        this.restaurantsGateway.emitOrderStatusUpdate(updatedOrder);
      }

      return createResponse(
        'OK',
        updatedOrder,
        'Order status updated successfully'
      );
    } catch (error) {
      console.error('Error updating order status:', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while updating the order status'
      );
    }
  }

  async findAll(): Promise<ApiResponse<Restaurant[]>> {
    try {
      const restaurants = await this.restaurantsRepository.findAll();
      return createResponse(
        'OK',
        restaurants,
        'Restaurants retrieved successfully'
      );
    } catch (error) {
      console.error('Error finding restaurants:', error);
      return createResponse(
        'ServerError',
        null,
        'Error retrieving restaurants'
      );
    }
  }

  async findOne(id: string): Promise<ApiResponse<Restaurant>> {
    try {
      const restaurant = await this.restaurantsRepository.findById(id);
      if (!restaurant) {
        return createResponse('NotFound', null, 'Restaurant not found');
      }
      return createResponse(
        'OK',
        restaurant,
        'Restaurant retrieved successfully'
      );
    } catch (error) {
      console.error('Error finding restaurant:', error);
      return createResponse('ServerError', null, 'Error retrieving restaurant');
    }
  }

  async remove(id: string): Promise<ApiResponse<boolean>> {
    try {
      const restaurant = await this.restaurantsRepository.findById(id);
      if (!restaurant) {
        return createResponse('NotFound', null, 'Restaurant not found');
      }

      const deleted = await this.restaurantsRepository.delete(id);
      if (!deleted) {
        return createResponse(
          'ServerError',
          null,
          'Failed to delete restaurant'
        );
      }

      return createResponse('OK', true, 'Restaurant deleted successfully');
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      return createResponse('ServerError', null, 'Error deleting restaurant');
    }
  }
}
