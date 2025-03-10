import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { createResponse, ApiResponse } from 'src/utils/createResponse';
import { UserRepository } from '../users/users.repository';
import { AddressBookRepository } from 'src/address_book/address_book.repository';
import { FoodCategoriesRepository } from 'src/food_categories/food_categories.repository';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { RestaurantsRepository } from 'src/restaurants/restaurants.repository';
import { CustomersRepository } from './customers.repository';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity';

export interface AddressPopulate {
  id?: string;
  street?: string;
  city?: string;
  postal_code?: number;
  location?: {
    lat?: number;
    lon?: number;
  };
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly restaurantRepository: RestaurantsRepository,
    private readonly userRepository: UserRepository,
    private readonly addressRepository: AddressBookRepository,
    private readonly foodCategoriesRepository: FoodCategoriesRepository,
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

          // Find how many times the customer has visited this restaurant
          const visitHistory = restaurant_history.find(
            history => history.restaurant_id === restaurant.id
          );
          const visitCount = visitHistory ? visitHistory.count : 0;

          // Calculate distance between customer and restaurant (in km)
          const distance = this.calculateDistance(
            customerLocation.lat,
            customerLocation.lon,
            restaurantLocation.lat,
            restaurantLocation.lon
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

  // // Private helper methods
  // private async validateAndUpdateAddress(
  //   customer: Customer,
  //   addressId: string
  // ): Promise<boolean> {
  //   const addressExists = await this.addressRepository.findById(addressId);
  //   if (!addressExists) return false;

  //   const addressIndex = customer.address.indexOf(addressId);
  //   if (addressIndex !== -1) {
  //     customer.address.splice(addressIndex, 1);
  //   } else {
  //     customer.address.push(addressId);
  //   }
  //   return true;
  // }

  // private async validateAndUpdateFavoriteRestaurants(
  //   customer: Customer,
  //   restaurantId: string
  // ): Promise<boolean> {
  //   const restaurantExists =
  //     await this.restaurantRepository.findById(restaurantId);
  //   if (!restaurantExists) return false;

  //   const restaurantIndex = customer.favorite_restaurants.indexOf(restaurantId);
  //   if (restaurantIndex !== -1) {
  //     customer.favorite_restaurants.splice(restaurantIndex, 1);
  //   } else {
  //     customer.favorite_restaurants.push(restaurantId);
  //   }
  //   return true;
  // }

  // private async validateAndUpdatePreferredCategory(
  //   customer: Customer,
  //   categoryId: string
  // ): Promise<boolean> {
  //   const categoryExists =
  //     await this.foodCategoriesRepository.findById(categoryId);
  //   if (!categoryExists) return false;

  //   const categoryIndex = customer.preferred_category.indexOf(categoryId);
  //   if (categoryIndex !== -1) {
  //     customer.preferred_category.splice(categoryIndex, 1);
  //   } else {
  //     customer.preferred_category.push(categoryId);
  //   }
  //   return true;
  // }

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
