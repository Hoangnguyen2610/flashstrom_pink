import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { createResponse, ApiResponse } from 'src/utils/createResponse';
import { UserRepository } from '../users/users.repository';
// import { AddressBookRepository } from 'src/address_book/address_book.repository';
// import { FoodCategoriesRepository } from 'src/food_categories/food_categories.repository';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { RestaurantsRepository } from 'src/restaurants/restaurants.repository';
import { CustomersRepository } from './customers.repository';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity';
// import { OrdersRepository } from 'src/orders/orders.repository';
import { MenuItem } from 'src/menu_items/entities/menu_item.entity';
import { DataSource } from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
export interface AddressPopulate {
  id?: string;
  street?: string;
  city?: string;
  postal_code?: number;
  location?: {
    lat?: number;
    lng?: number;
  };
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly restaurantRepository: RestaurantsRepository,
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
    private readonly customerRepository: CustomersRepository
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto
  ): Promise<ApiResponse<Customer>> {
    try {
      const existingUser = await this.userRepository.findById(
        createCustomerDto.user_id
      );
      if (!existingUser) {
        return createResponse('NotFound', null, 'User not found');
      }

      const existingCustomer = await this.customerRepository.findByUserId(
        createCustomerDto.user_id
      );
      if (existingCustomer) {
        return createResponse(
          'DuplicatedRecord',
          null,
          'Customer with this user ID already exists'
        );
      }

      const newCustomer =
        await this.customerRepository.create(createCustomerDto);
      return createResponse('OK', newCustomer, 'Customer created successfully');
    } catch (error) {
      console.error('Error creating customer:', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while creating the customer'
      );
    }
  }

  async findAll(): Promise<ApiResponse<Customer[]>> {
    try {
      const customers = await this.customerRepository.findAll();
      return createResponse('OK', customers, 'Fetched all customers');
    } catch (error) {
      console.error('Error fetching customers:', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while fetching customers'
      );
    }
  }

  async findCustomerById(id: string): Promise<ApiResponse<any>> {
    try {
      const customer = await this.customerRepository.findById(id);
      if (!customer) {
        return createResponse('NotFound', null, 'Customer not found');
      }

      const user = await this.userRepository.findById(customer.user_id);
      if (!user) {
        return createResponse('NotFound', null, 'User not found');
      }

      const customerWithUserData = {
        ...customer,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          is_verified: user.is_verified
        }
      };

      return createResponse(
        'OK',
        customerWithUserData,
        'Fetched customer and user data successfully'
      );
    } catch (error) {
      console.error('Error fetching customer and user:', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while fetching the customer and user data'
      );
    }
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto
  ): Promise<ApiResponse<Customer>> {
    try {
      const updatedCustomer = await this.customerRepository.update(
        id,
        updateCustomerDto
      );
      console.log(
        'check toggle favourite restaurant',
        id,
        updatedCustomer,
        'customerdto',
        updateCustomerDto
      );
      if (!updatedCustomer) {
        return createResponse('NotFound', null, 'Customer not found');
      }
      return createResponse(
        'OK',
        updatedCustomer,
        'Customer updated successfully'
      );
    } catch (error) {
      console.error('Error updating customer:', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while updating the customer'
      );
    }
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      await this.customerRepository.remove(id);
      return createResponse('OK', null, 'Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while deleting the customer'
      );
    }
  }

  async updateEntityAvatar(
    uploadResult: { url: string; public_id: string },
    entityId: string
  ) {
    try {
      const customer = await this.customerRepository.findById(entityId);
      if (!customer) {
        return createResponse('NotFound', null, 'Customer not found');
      }

      const updateDto = new UpdateCustomerDto();
      updateDto.avatar = {
        url: uploadResult.url,
        key: uploadResult.public_id
      };

      const updatedCustomer = await this.customerRepository.update(
        entityId,
        updateDto
      );

      return createResponse(
        'OK',
        updatedCustomer,
        'Customer avatar updated successfully'
      );
    } catch (error) {
      console.error('Error updating customer avatar:', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while updating the customer avatar'
      );
    }
  }

  // Helper function to check if a restaurant is open based on the current time
  private isRestaurantOpen(restaurant: Restaurant): boolean {
    const currentDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = new Date().getHours() * 60 + new Date().getMinutes(); // Convert current time to minutes

    const openingHours = restaurant.opening_hours;
    const dayOfWeek = Object.keys(openingHours)[currentDay]; // Get the opening hours for today

    if (openingHours[dayOfWeek]) {
      const { from, to } = openingHours[dayOfWeek];
      return currentTime >= from && currentTime <= to;
    }
    return false;
  }

  // Haversine formula to calculate the distance between two lat/lon points (in km)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  async getAllRestaurants(customerId: string): Promise<any> {
    try {
      // Fetch customer data to get preferences and restaurant history
      const customer = await this.customerRepository.findById(customerId);

      if (!customer) {
        return createResponse('NotFound', null, 'Customer not found');
      }

      const {
        preferred_category,
        restaurant_history,
        address: customerAddress // customerAddress should be populated now
      } = customer;

      // Make sure the customer address is treated as an array of AddressPopulate objects
      const customerAddressArray = customerAddress as AddressPopulate[];

      // Fetch all restaurants
      const restaurants = await this.restaurantRepository.findAll();

      // Prioritize restaurants based on the preferred categories, restaurant history, and distance
      const prioritizedRestaurants = restaurants
        .map(restaurant => {
          // Type assertion to treat customerAddress as an array of objects and each with a location
          const customerLocation = (customerAddressArray &&
            customerAddressArray[0]?.location) as
            | AddressPopulate['location']
            | undefined;

          // Ensure restaurant.address is treated as an AddressPopulate object
          const restaurantAddress = restaurant.address as
            | AddressPopulate
            | undefined;

          // If either location is missing, return the restaurant with a priority score of 0
          if (!customerLocation || !restaurantAddress?.location) {
            return { ...restaurant, priorityScore: 0 }; // Default score if no address or location
          }

          const restaurantLocation = restaurantAddress.location;

          // Check if the restaurant matches the customer's preferred category
          const isPreferred = restaurant.specialize_in.some(category =>
            preferred_category.includes(category as unknown as FoodCategory)
          );

          // Find how many times the customer has visited this restaurant, default to 0 if restaurant_history is null
          const visitHistory = restaurant_history
            ? restaurant_history.find(
                history => history.restaurant_id === restaurant.id
              )
            : null;
          const visitCount = visitHistory ? visitHistory.count : 0;

          // Calculate distance between customer and restaurant (in km)
          const distance = this.calculateDistance(
            customerLocation.lat,
            customerLocation.lng,
            restaurantLocation.lat,
            restaurantLocation.lng
          );

          // Adjust how much distance impacts the score
          const distanceWeight = 1 / (distance + 1); // The closer, the higher the weight

          // Create a prioritization score (higher is better)
          const priorityScore =
            (isPreferred ? 1 : 0) * 3 + visitCount * 2 + distanceWeight * 5; // Add distance weighting here

          return {
            ...restaurant,
            priorityScore // Add the score to the restaurant object
          };
        })
        .sort((a, b) => b.priorityScore - a.priorityScore); // Sort by the priority score in descending order

      // Return sorted list of restaurants (still includes all restaurants, just sorted)
      return createResponse(
        'OK',
        prioritizedRestaurants,
        'Fetched and prioritized restaurants successfully'
      );
    } catch (error) {
      console.error('Error fetching and prioritizing restaurants:', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while fetching and prioritizing restaurants'
      );
    }
  }
  async getAllOrders(customerId: string): Promise<any> {
    try {
      // Fetch customer data để kiểm tra tồn tại
      const customer = await this.customerRepository.findById(customerId);

      if (!customer) {
        return createResponse('NotFound', null, 'Customer not found');
      }

      // Fetch orders của customer với các quan hệ cần thiết bằng DataSource
      const orders = await this.dataSource.getRepository(Order).find({
        where: { customer_id: customerId }, // Lọc theo customerId
        relations: [
          'restaurant', // Populate restaurant
          'customer', // Populate customer (nếu cần)
          'driver', // Populate driver (tuỳ chọn)
          'customerAddress', // Populate customer_location từ AddressBook
          'restaurantAddress' // Populate restaurant_location từ AddressBook
        ],
        select: {
          id: true,
          customer_id: true,
          restaurant_id: true,
          driver_id: true,
          status: true,
          total_amount: true,
          payment_status: true,
          payment_method: true,
          customer_location: true,
          restaurant_location: true,
          order_items: true, // Lấy order_items
          customer_note: true,
          restaurant_note: true,
          distance: true,
          delivery_fee: true,
          updated_at: true,
          order_time: true,
          delivery_time: true,
          tracking_info: true,
          restaurant: {
            id: true,
            restaurant_name: true,
            address_id: true,
            avatar: {
              url: true,
              key: true
            }
          }
        }
      });

      if (!orders || orders.length === 0) {
        return createResponse('OK', [], 'No orders found for this customer');
      }

      // Lấy specialize_in từ restaurant_specializations và join với food_categories
      const restaurantIds = orders.map(order => order.restaurant_id);
      const specializations = await this.dataSource
        .createQueryBuilder()
        .select('rs.restaurant_id', 'restaurant_id')
        .addSelect('array_agg(fc.name)', 'specializations') // Gom nhóm các danh mục món ăn
        .from('restaurant_specializations', 'rs')
        .leftJoin('food_categories', 'fc', 'fc.id = rs.food_category_id') // Join với food_categories
        .where('rs.restaurant_id IN (:...restaurantIds)', { restaurantIds })
        .groupBy('rs.restaurant_id')
        .getRawMany();

      // Map specializations vào orders
      const specializationMap = new Map(
        specializations.map(spec => [spec.restaurant_id, spec.specializations])
      );

      // Populate thông tin MenuItem và specializations cho từng order
      const populatedOrders = await Promise.all(
        orders.map(async order => {
          const populatedOrderItems = await Promise.all(
            order.order_items.map(async item => {
              // Tìm MenuItem theo item_id
              const menuItem = await this.dataSource
                .getRepository(MenuItem)
                .findOne({
                  where: { id: item.item_id },
                  relations: ['restaurant', 'variants'], // Populate restaurant và variants
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    avatar: {
                      url: true,
                      key: true
                    },
                    restaurant: {
                      id: true,
                      restaurant_name: true,
                      address_id: true,
                      avatar: {
                        url: true,
                        key: true
                      }
                    }
                  }
                });

              return {
                ...item,
                menu_item: menuItem || null // Nếu không tìm thấy MenuItem, trả về null
              };
            })
          );

          // Gắn specializations vào restaurant của order
          const restaurantSpecializations =
            specializationMap.get(order.restaurant_id) || [];

          return {
            ...order,
            order_items: populatedOrderItems, // Thay order_items bằng dữ liệu đã populate
            customer_address: order.customerAddress, // Thêm thông tin từ AddressBook
            restaurant_address: order.restaurantAddress, // Thêm thông tin từ AddressBook
            restaurant: {
              ...order.restaurant,
              specialize_in: restaurantSpecializations // Thêm specialize_in vào restaurant
            }
          };
        })
      );

      // Trả về danh sách orders đã được populate
      return createResponse(
        'OK',
        populatedOrders,
        'Fetched orders successfully'
      );
    } catch (error) {
      console.error('Error fetching orders:', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while fetching orders'
      );
    }
  }

  async findOne(conditions: Partial<Customer>): Promise<ApiResponse<Customer>> {
    try {
      const customer = await this.customerRepository.findOneBy(conditions);
      if (!customer) {
        return createResponse('NotFound', null, 'Customer not found');
      }
      return createResponse('OK', customer, 'Customer found successfully');
    } catch (error) {
      console.error('Error finding customer:', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while finding the customer'
      );
    }
  }
}
