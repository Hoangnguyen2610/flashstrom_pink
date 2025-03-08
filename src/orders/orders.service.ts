import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { createResponse } from 'src/utils/createResponse';
import { ApiResponse } from 'src/utils/createResponse';
import { FIXED_DELIVERY_DRIVER_WAGE } from 'src/utils/constants';
import { OrdersRepository } from './orders.repository';
import { RestaurantsGateway } from '../restaurants/restaurants.gateway';
import { AddressBookRepository } from 'src/address_book/address_book.repository';
import { RestaurantsRepository } from 'src/restaurants/restaurants.repository';
import { CustomersRepository } from 'src/customers/customers.repository';
import { MenuItemsRepository } from 'src/menu_items/menu_items.repository';
import { MenuItemVariantsRepository } from 'src/menu_item_variants/menu_item_variants.repository';
import { OrderStatus, OrderTrackingInfo } from './entities/order.entity';
import { DataSource } from 'typeorm';
import { CartItemsRepository } from 'src/cart_items/cart_items.repository';
import { CartItem } from 'src/cart_items/entities/cart_item.entity';
@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly menuItemsRepository: MenuItemsRepository,
    private readonly menuItemVariantsRepository: MenuItemVariantsRepository,
    private readonly addressRepository: AddressBookRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly restaurantRepository: RestaurantsRepository,
    private readonly restaurantsGateway: RestaurantsGateway,
    private readonly dataSource: DataSource,
    private readonly cartItemsRepository: CartItemsRepository
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto
  ): Promise<ApiResponse<Order>> {
    try {
      // Validate dữ liệu đầu vào
      const validationResult = await this.validateOrderData(createOrderDto);
      if (validationResult !== true) {
        return validationResult;
      }
      console.log('check input', createOrderDto);

      // Tạo transaction để đảm bảo đồng bộ giữa Order và CartItem
      const result = await this.dataSource.transaction(
        async transactionalEntityManager => {
          // Lấy danh sách CartItem của customer thông qua transaction
          const cartItems = await transactionalEntityManager
            .getRepository(CartItem)
            .find({
              where: { customer_id: createOrderDto.customer_id }
            });

          // Kiểm tra và xử lý từng order_item dựa trên CartItem
          let hasCartItems = false; // Biến để kiểm tra xem có xử lý CartItem hay không
          for (const orderItem of createOrderDto.order_items) {
            const cartItem = cartItems.find(
              ci => ci.item_id === orderItem.item_id
            );

            if (!cartItem) {
              console.log(
                `Cart item with item_id ${orderItem.item_id} not found for customer ${createOrderDto.customer_id}. Proceeding without modifying cart.`
              );
              continue; // Bỏ qua xử lý CartItem và tiếp tục tạo order
            }

            hasCartItems = true; // Đánh dấu rằng có CartItem được xử lý

            // Tìm variant tương ứng trong CartItem
            const cartVariant = cartItem.variants.find(
              v => v.variant_id === orderItem.variant_id
            );
            if (!cartVariant) {
              console.log(
                `Variant ${orderItem.variant_id} not found in cart item ${cartItem.id}. Proceeding without modifying cart.`
              );
              continue; // Bỏ qua xử lý variant và tiếp tục
            }

            const orderQuantity = orderItem.quantity;
            const cartQuantity = cartVariant.quantity;

            // Kiểm tra quantity
            if (orderQuantity > cartQuantity) {
              return createResponse(
                'NotAcceptingOrders',
                null,
                `Order quantity (${orderQuantity}) exceeds cart quantity (${cartQuantity}) for item ${orderItem.item_id}, variant ${orderItem.variant_id}`
              );
            }

            // Xử lý CartItem dựa trên quantity
            if (orderQuantity === cartQuantity) {
              // Xóa CartItem nếu quantity bằng nhau
              await transactionalEntityManager
                .getRepository(CartItem)
                .delete(cartItem.id);
              console.log(
                `Deleted cart item ${cartItem.id} as order quantity matches cart quantity`
              );
            } else if (orderQuantity < cartQuantity) {
              // Cập nhật CartItem nếu quantity nhỏ hơn
              const updatedVariants = cartItem.variants.map(v => {
                if (v.variant_id === orderItem.variant_id) {
                  return { ...v, quantity: v.quantity - orderQuantity };
                }
                return v;
              });

              await transactionalEntityManager
                .getRepository(CartItem)
                .update(cartItem.id, {
                  variants: updatedVariants,
                  updated_at: Math.floor(Date.now() / 1000),
                  item_id: cartItem.item_id,
                  customer_id: cartItem.customer_id,
                  restaurant_id: cartItem.restaurant_id
                });
              console.log(
                `Updated cart item ${cartItem.id} with reduced quantity`
              );
            }
          }

          // Tạo Order sau khi xử lý CartItem (hoặc không nếu không có CartItem)
          const newOrder = await transactionalEntityManager
            .getRepository(Order)
            .save(transactionalEntityManager.create(Order, createOrderDto));

          // Cập nhật purchase count cho menu items
          await this.updateMenuItemPurchaseCount(createOrderDto.order_items);

          // Thông báo cho restaurant và driver
          const orderResponse = await this.notifyRestaurantAndDriver(newOrder);

          return orderResponse;
        }
      );

      return createResponse('OK', result, 'Order created successfully');
    } catch (error) {
      console.error('Error creating order:', error);
      return createResponse('ServerError', null, 'Error creating order');
    }
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderDto
  ): Promise<ApiResponse<Order>> {
    try {
      const order = await this.ordersRepository.findById(id);
      if (!order) {
        return createResponse('NotFound', null, 'Order not found');
      }

      const updatedOrder = await this.ordersRepository.update(
        id,
        updateOrderDto
      );

      return createResponse('OK', updatedOrder, 'Order updated successfully');
    } catch (error) {
      return this.handleError('Error updating order:', error);
    }
  }

  async findAll(): Promise<ApiResponse<Order[]>> {
    try {
      const orders = await this.ordersRepository.findAll();
      return createResponse('OK', orders, 'Fetched all orders');
    } catch (error) {
      return this.handleError('Error fetching orders:', error);
    }
  }

  async findOne(id: string): Promise<ApiResponse<Order>> {
    try {
      // console.log('check id', id);
      const order = await this.ordersRepository.findById(id);
      // console.log('check order', this.handleOrderResponse(order));
      return this.handleOrderResponse(order);
    } catch (error) {
      return this.handleError('Error fetching order:', error);
    }
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      const deletedOrder = await this.ordersRepository.delete(id);
      if (!deletedOrder) {
        return createResponse('NotFound', null, 'Order not found');
      }
      return createResponse('OK', null, 'Order deleted successfully');
    } catch (error) {
      return this.handleError('Error deleting order:', error);
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<ApiResponse<Order>> {
    try {
      const order = await this.ordersRepository.findById(orderId);
      if (!order) {
        return createResponse('NotFound', null, 'Order not found');
      }

      // Cập nhật status
      const updatedOrder = await this.ordersRepository.updateStatus(
        orderId,
        status
      );

      // Cập nhật tracking_info dựa trên status
      const trackingInfoMap = {
        [OrderStatus.RESTAURANT_ACCEPTED]: OrderTrackingInfo.PREPARING,
        [OrderStatus.IN_PROGRESS]: OrderTrackingInfo.OUT_FOR_DELIVERY,
        [OrderStatus.DELIVERED]: OrderTrackingInfo.DELIVERED
      };
      const trackingInfo = trackingInfoMap[status];
      if (trackingInfo) {
        await this.ordersRepository.updateTrackingInfo(orderId, trackingInfo);
      } else {
        console.warn(`No tracking info mapped for status: ${status}`);
      }

      return createResponse(
        'OK',
        updatedOrder,
        'Order status updated successfully'
      );
    } catch (error) {
      console.error('Error updating order status:', error);
      return createResponse('ServerError', null, 'Error updating order status');
    }
  }

  // Private helper methods
  private async validateOrderData(
    orderDto: CreateOrderDto | UpdateOrderDto
  ): Promise<true | ApiResponse<null>> {
    const {
      customer_id,
      restaurant_id,
      customer_location,
      restaurant_location,
      order_items
    } = orderDto;

    if (!customer_id) {
      return createResponse('MissingInput', null, 'Customer ID is required');
    }

    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      return createResponse('NotFound', null, 'Customer not found');
    }

    const restaurant = await this.restaurantRepository.findById(restaurant_id);
    console.log('restaurant', restaurant);
    if (!restaurant) {
      return createResponse('NotFound', null, 'Restaurant not found');
    }

    if (!restaurant.status.is_accepted_orders) {
      return createResponse(
        'NotAcceptingOrders',
        null,
        'Restaurant is not accepting orders'
      );
    }

    const customerAddress =
      await this.addressRepository.findById(customer_location);
    if (!customerAddress) {
      return createResponse('NotFound', null, 'Customer address not found');
    }

    const restaurantAddress =
      await this.addressRepository.findById(restaurant_location);
    if (!restaurantAddress) {
      return createResponse('NotFound', null, 'Restaurant address not found');
    }

    const itemValidation = await this.validateOrderItems(order_items);
    if (itemValidation !== true) {
      return itemValidation;
    }

    return true;
  }

  private async validateOrderItems(
    orderItems: any[]
  ): Promise<true | ApiResponse<null>> {
    for (const item of orderItems) {
      const menuItem = await this.menuItemsRepository.findById(item.item_id);
      if (!menuItem) {
        return createResponse(
          'NotFound',
          null,
          `Menu item ${item.item_id} not found`
        );
      }

      const variant = await this.menuItemVariantsRepository.findById(
        item.variant_id
      );
      if (!variant) {
        return createResponse(
          'NotFound',
          null,
          `Variant ${item.variant_id} not found for item ${item.item_id}`
        );
      }
    }
    return true;
  }

  private async updateMenuItemPurchaseCount(orderItems: any[]): Promise<void> {
    for (const item of orderItems) {
      const menuItem = await this.menuItemsRepository.findById(item.item_id);
      if (menuItem) {
        const updateData = {
          purchase_count: (menuItem.purchase_count || 0) + 1,
          updated_at: Math.floor(Date.now() / 1000)
        };

        await this.menuItemsRepository.update(menuItem.id, updateData);
      }
    }
  }

  private async notifyRestaurantAndDriver(order: Order): Promise<any> {
    const orderWithDriverWage = {
      ...order,
      driver_wage: FIXED_DELIVERY_DRIVER_WAGE
    };

    await this.restaurantsGateway.handleNewOrder(orderWithDriverWage);

    return orderWithDriverWage;
  }

  private handleOrderResponse(order: Order | null): ApiResponse<Order> {
    if (!order) {
      return createResponse('NotFound', null, 'Order not found');
    }
    return createResponse('OK', order, 'Order retrieved successfully');
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
