import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './orders.schema'; // Assuming you have an Order schema
import { Customer } from 'src/customers/customer.schema'; // Customer schema (assumed)
import { Restaurant } from 'src/restaurants/restaurants.schema'; // Restaurant schema (assumed)
import { createResponse } from 'src/utils/createResponse'; // Utility for creating responses
import { AddressBook } from 'src/address_book/address_book.schema';
import { MenuItem } from 'src/menu_items/menu_items.schema';
import { MenuItemVariant } from 'src/menu_item_variants/menu_item_variants.schema';
import { RestaurantsGateway } from '../restaurants/restaurants.gateway';
// import { DriversGateway } from 'src/drivers/drivers.gateway';
import { FIXED_DELIVERY_DRIVER_WAGE } from 'src/utils/constants';
import { ApiResponse } from 'src/utils/createResponse';
import { DriverProgressStage } from 'src/driver_progress_stages/driver_progress_stages.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    @InjectModel('MenuItem') private readonly menuItemModel: Model<MenuItem>,
    @InjectModel('MenuItemVariant')
    private readonly menuItemVariantModel: Model<MenuItemVariant>,
    @InjectModel('AddressBook')
    private readonly addressBookModel: Model<AddressBook>,
    @InjectModel('Customer') private readonly customerModel: Model<Customer>,
    @InjectModel('Restaurant')
    private readonly restaurantModel: Model<Restaurant>,
    private readonly restaurantsGateway: RestaurantsGateway,
    @InjectModel('DriverProgressStage')
    private readonly driverProgressStageModel: Model<DriverProgressStage>
    // private readonly driversGateway: DriversGateway
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<ApiResponse<any>> {
    try {
      const validationResult = await this.validateOrderData(createOrderDto);
      if (validationResult !== true) {
        return validationResult;
      }

      const newOrder = await this.saveNewOrder(createOrderDto);
      await this.updateMenuItemPurchaseCount(createOrderDto.order_items);

      const orderResponse = await this.notifyRestaurantAndDriver(newOrder);
      return createResponse('OK', orderResponse, 'Order created successfully');
    } catch (error) {
      return this.handleError('Error creating order:', error);
    }
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderDto
  ): Promise<ApiResponse<Order>> {
    try {
      const order = await this.orderModel.findById(id);
      if (!order) {
        return createResponse('NotFound', null, 'Order not found');
      }

      const updatedOrder = await this.orderModel
        .findByIdAndUpdate(id, updateOrderDto, { new: true })
        .exec();

      return createResponse('OK', updatedOrder, 'Order updated successfully');
    } catch (error) {
      return this.handleError('Error updating order:', error);
    }
  }

  async findAll(): Promise<ApiResponse<Order[]>> {
    try {
      const orders = await this.orderModel.find().exec();
      return createResponse('OK', orders, 'Fetched all orders');
    } catch (error) {
      return this.handleError('Error fetching orders:', error);
    }
  }

  async findOne(id: string): Promise<ApiResponse<Order>> {
    try {
      const order = await this.orderModel
        .findById(id)
        .populate('customer_location')
        .exec();
      return this.handleOrderResponse(order);
    } catch (error) {
      return this.handleError('Error fetching order:', error);
    }
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      const deletedOrder = await this.orderModel.findByIdAndDelete(id).exec();
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
    status: string
  ): Promise<ApiResponse<Order>> {
    try {
      const order = await this.orderModel.findById(orderId);
      if (!order) {
        return createResponse('NotFound', null, 'Order not found');
      }

      const updatedOrder = await this.orderModel
        .findByIdAndUpdate(
          orderId,
          {
            status,
            tracking_info: status,
            updated_at: Math.floor(Date.now() / 1000)
          },
          { new: true }
        )
        .exec();

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

    const customer = await this.customerModel.findById(customer_id).exec();
    if (!customer) {
      return createResponse('NotFound', null, 'Customer not found');
    }

    const restaurant = await this.restaurantModel
      .findById(restaurant_id)
      .exec();
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

    const customerAddress = await this.addressBookModel
      .findById(customer_location)
      .exec();
    if (!customerAddress) {
      return createResponse('NotFound', null, 'Customer address not found');
    }

    const restaurantAddress = await this.addressBookModel
      .findById(restaurant_location)
      .exec();
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
      const menuItem = await this.menuItemModel.findById(item.item_id).exec();
      if (!menuItem) {
        return createResponse(
          'NotFound',
          null,
          `Menu item ${item.item_id} not found`
        );
      }

      const variant = await this.menuItemVariantModel
        .findById(item.variant_id)
        .exec();
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

  private async saveNewOrder(orderData: CreateOrderDto): Promise<Order> {
    const newOrder = new this.orderModel({
      ...orderData,
      payment_status: orderData.payment_method === 'COD' ? 'PENDING' : 'PAID',
      created_at: new Date().getTime(),
      updated_at: new Date().getTime()
    });
    return newOrder.save();
  }

  private async updateMenuItemPurchaseCount(orderItems: any[]): Promise<void> {
    for (const item of orderItems) {
      const menuItem = await this.menuItemModel.findById(item.item_id).exec();
      if (menuItem) {
        menuItem.purchase_count += 1;
        await menuItem.save();
      }
    }
  }

  private async notifyRestaurantAndDriver(order: Order): Promise<any> {
    const orderWithDriverWage = {
      ...order.toObject(),
      driver_wage: FIXED_DELIVERY_DRIVER_WAGE
    };

    await this.restaurantsGateway.handleNewOrder(orderWithDriverWage);
    // Uncomment when driver notification is needed
    // await this.driverGateway.handleNewOrder(order);

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
