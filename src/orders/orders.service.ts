import { forwardRef, Inject, Injectable } from '@nestjs/common';
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
import { DataSource, EntityManager } from 'typeorm';
import { CartItemsRepository } from 'src/cart_items/cart_items.repository';
import { CartItem } from 'src/cart_items/entities/cart_item.entity';
import { CustomersGateway } from 'src/customers/customers.gateway';
import { DriversGateway } from 'src/drivers/drivers.gateway';
import { TransactionService } from 'src/transactions/transactions.service';
import { CreateTransactionDto } from 'src/transactions/dto/create-transaction.dto';
import { FWalletsRepository } from 'src/fwallets/fwallets.repository';

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
    private readonly cartItemsRepository: CartItemsRepository,
    private readonly customersGateway: CustomersGateway,
    @Inject(forwardRef(() => DriversGateway)) // Inject DriversGateway với forwardRef
    private readonly driversGateway: DriversGateway,
    private readonly transactionsService: TransactionService,
    private readonly fWalletsRepository: FWalletsRepository
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto
  ): Promise<ApiResponse<Order>> {
    try {
      const validationResult = await this.validateOrderData(createOrderDto);
      if (validationResult !== true) {
        return validationResult;
      }
      console.log('check input', createOrderDto);

      const user = await this.customersRepository.findById(
        createOrderDto.customer_id
      );
      if (!user) {
        return createResponse(
          'NotFound',
          null,
          `Customer ${createOrderDto.customer_id} not found`
        );
      }

      const result = await this.dataSource.transaction(
        async transactionalEntityManager => {
          if (createOrderDto.payment_method === 'FWallet') {
            // Lấy wallet của khách
            const customerWallet = await this.fWalletsRepository.findByUserId(
              user.user_id
            );
            if (!customerWallet) {
              return createResponse(
                'NotFound',
                null,
                `Wallet not found for customer ${createOrderDto.customer_id}`
              );
            }

            // Lấy restaurant từ restaurant_id
            const restaurant = await this.restaurantRepository.findById(
              createOrderDto.restaurant_id
            );
            if (!restaurant) {
              return createResponse(
                'NotFound',
                null,
                `Restaurant ${createOrderDto.restaurant_id} not found`
              );
            }

            // Lấy wallet của restaurant từ user_id của restaurant
            const restaurantWallet = await this.fWalletsRepository.findByUserId(
              restaurant.owner_id
            );
            if (!restaurantWallet) {
              return createResponse(
                'NotFound',
                null,
                `Wallet not found for restaurant ${createOrderDto.restaurant_id}`
              );
            }

            const transactionDto = {
              user_id: user.user_id,
              fwallet_id: customerWallet.id,
              transaction_type: 'PURCHASE',
              amount: createOrderDto.total_amount,
              balance_after: 0,
              status: 'PENDING',
              source: 'FWALLET',
              destination: restaurantWallet.id, // Sửa thành wallet của restaurant
              destination_type: 'FWALLET'
            } as CreateTransactionDto;

            const transactionResponse = await this.transactionsService.create(
              transactionDto,
              transactionalEntityManager
            );
            console.log('check transac res', transactionResponse);
            if (transactionResponse.EC === -8) {
              console.log('Transaction failed:', transactionResponse.EM); // Sửa EM thành EM
              return createResponse(
                'InsufficientBalance',
                null,
                'Balance in the source wallet is not enough for this transaction.'
              );
            }
            console.log('Transaction succeeded:', transactionResponse.data);
          }

          const cartItems = await transactionalEntityManager
            .getRepository(CartItem)
            .find({ where: { customer_id: createOrderDto.customer_id } });

          for (const orderItem of createOrderDto.order_items) {
            const cartItem = cartItems.find(
              ci => ci.item_id === orderItem.item_id
            );
            if (!cartItem) {
              console.log(
                `Cart item with item_id ${orderItem.item_id} not found for customer ${createOrderDto.customer_id}. Proceeding without modifying cart.`
              );
              continue;
            }

            const cartVariant = cartItem.variants.find(
              v => v.variant_id === orderItem.variant_id
            );
            if (!cartVariant) {
              console.log(
                `Variant ${orderItem.variant_id} not found in cart item ${cartItem.id}. Proceeding without modifying cart.`
              );
              continue;
            }

            const orderQuantity = orderItem.quantity;
            const cartQuantity = cartVariant.quantity;

            if (orderQuantity > cartQuantity) {
              return createResponse(
                'NotAcceptingOrders',
                null,
                `Order quantity (${orderQuantity}) exceeds cart quantity (${cartQuantity}) for item ${orderItem.item_id}, variant ${orderItem.variant_id}`
              );
            }

            if (orderQuantity === cartQuantity) {
              await transactionalEntityManager
                .getRepository(CartItem)
                .delete(cartItem.id);
              console.log(
                `Deleted cart item ${cartItem.id} as order quantity matches cart quantity`
              );
            } else if (orderQuantity < cartQuantity) {
              const updatedVariants = cartItem.variants.map(v =>
                v.variant_id === orderItem.variant_id
                  ? { ...v, quantity: v.quantity - orderQuantity }
                  : v
              );
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

          const orderData = {
            ...createOrderDto,
            status: createOrderDto.status as OrderStatus,
            tracking_info: createOrderDto.tracking_info as OrderTrackingInfo
          };
          const newOrder = await transactionalEntityManager
            .getRepository(Order)
            .save(transactionalEntityManager.create(Order, orderData));

          await this.updateMenuItemPurchaseCount(createOrderDto.order_items);

          const orderResponse = await this.notifyRestaurantAndDriver(newOrder);
          console.log('Order transaction completed, result:', orderResponse);
          return orderResponse;
        }
      );

      if (result.EC !== 0) {
        return result;
      }

      console.log('Order fully committed to DB');
      return createResponse('OK', result.data, 'Order created successfully');
    } catch (error) {
      console.error('Error creating order:', error);
      return createResponse('ServerError', null, 'Error creating order');
    }
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
    transactionalEntityManager?: EntityManager
  ): Promise<ApiResponse<Order>> {
    try {
      const manager = transactionalEntityManager || this.dataSource.manager;
      const order = await manager.findOne(Order, { where: { id } });
      if (!order) {
        return createResponse('NotFound', null, 'Order not found');
      }

      const updatedData = {
        ...order,
        ...updateOrderDto,
        status: updateOrderDto.status
          ? (updateOrderDto.status as OrderStatus)
          : order.status,
        tracking_info: updateOrderDto.tracking_info
          ? (updateOrderDto.tracking_info as OrderTrackingInfo)
          : order.tracking_info
      };
      const updatedOrder = (await manager.save(Order, updatedData)) as Order;
      return createResponse('OK', updatedOrder, 'Order updated successfully');
    } catch (error) {
      return this.handleError('Error updating order:', error);
    }
  }

  // orders.service.ts (chỉ show đoạn updateOrderStatus)
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    transactionalEntityManager?: EntityManager
  ): Promise<ApiResponse<Order>> {
    try {
      const manager = transactionalEntityManager || this.dataSource.manager;
      console.log('🔍 Finding order:', orderId);
      const order = await manager.findOne(Order, { where: { id: orderId } });
      console.log('📋 Found order:', order);
      if (!order) {
        console.log('❌ Order not found:', orderId);
        return createResponse('NotFound', null, 'Order not found');
      }

      order.status = status;
      console.log('➡️ Updating order status to:', status);
      const updatedOrder = await manager.save(Order, order);
      console.log('✅ Updated order:', updatedOrder);

      const trackingInfoMap = {
        [OrderStatus.PENDING]: OrderTrackingInfo.ORDER_PLACED,
        [OrderStatus.RESTAURANT_ACCEPTED]: OrderTrackingInfo.ORDER_RECEIVED,
        [OrderStatus.PREPARING]: OrderTrackingInfo.PREPARING,
        [OrderStatus.IN_PROGRESS]: OrderTrackingInfo.IN_PROGRESS,
        [OrderStatus.READY_FOR_PICKUP]: OrderTrackingInfo.PREPARING,
        [OrderStatus.RESTAURANT_PICKUP]: OrderTrackingInfo.RESTAURANT_PICKUP,
        [OrderStatus.DISPATCHED]: OrderTrackingInfo.DISPATCHED,
        [OrderStatus.EN_ROUTE]: OrderTrackingInfo.EN_ROUTE,
        [OrderStatus.OUT_FOR_DELIVERY]: OrderTrackingInfo.OUT_FOR_DELIVERY,
        [OrderStatus.DELIVERY_FAILED]: OrderTrackingInfo.DELIVERY_FAILED,
        [OrderStatus.DELIVERED]: OrderTrackingInfo.DELIVERED
        // Bỏ RETURNED và CANCELLED như mày dặn
      };
      const trackingInfo = trackingInfoMap[status];
      if (trackingInfo) {
        order.tracking_info = trackingInfo;
        await manager.save(Order, order);
        console.log('✅ Updated tracking_info:', trackingInfo);
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

  async tipToDriver(
    orderId: string,
    tipAmount: number
  ): Promise<ApiResponse<Order>> {
    try {
      // Validate tip amount
      if (tipAmount < 0) {
        return createResponse(
          'InvalidFormatInput',
          null,
          'Tip amount cannot be negative'
        );
      }

      // Tìm order
      const order = await this.ordersRepository.findById(orderId);
      if (!order) {
        console.log('❌ Order not found:', orderId);
        return createResponse('NotFound', null, 'Order not found');
      }

      // Kiểm tra xem order đã có driver chưa
      if (!order.driver_id) {
        return createResponse(
          'NotFound',
          null,
          'No driver assigned to this order'
        );
      }

      // Kiểm tra trạng thái order (chỉ cho tip khi order đã hoàn thành hoặc đang giao)
      if (
        order.status !== OrderStatus.DELIVERED &&
        order.status !== OrderStatus.OUT_FOR_DELIVERY
      ) {
        return createResponse(
          'Forbidden',
          null,
          'Can only tip when order is out for delivery or delivered'
        );
      }

      // Update driver_tips
      const updatedOrder = await this.ordersRepository.updateDriverTips(
        orderId,
        tipAmount
      );
      console.log(
        '✅ Updated driver_tips:',
        tipAmount,
        'for order:',
        updatedOrder
      );

      // Thông báo cho driver qua DriversGateway
      await this.driversGateway.notifyPartiesOnce(updatedOrder);
      console.log(
        `Notified driver ${updatedOrder.driver_id} about tip of ${tipAmount} for order ${orderId}`
      );

      return createResponse('OK', updatedOrder, 'Driver tipped successfully');
    } catch (error) {
      console.error('Error tipping driver:', error);
      return createResponse('ServerError', null, 'Error tipping driver');
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

  async findOne(
    id: string,
    transactionalEntityManager?: EntityManager
  ): Promise<ApiResponse<Order>> {
    try {
      const manager = transactionalEntityManager || this.dataSource.manager; // Dùng dataSource.manager
      const order = await manager
        .getRepository(Order)
        .findOne({ where: { id } });
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
    await this.customersGateway.handleCustomerPlaceOrder(orderWithDriverWage);

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
