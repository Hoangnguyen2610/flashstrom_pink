import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AddressBook } from 'src/address_book/entities/address_book.entity';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@Injectable()
export class CustomersRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(AddressBook)
    private readonly addressRepository: Repository<AddressBook>,
    @InjectRepository(FoodCategory)
    private readonly foodCategoryRepository: Repository<FoodCategory>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>
  ) {}

  async save(customer: Customer): Promise<Customer> {
    return await this.customerRepository.save(customer);
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const {
      address_ids = [],
      preferred_category_ids = [],
      favorite_restaurant_ids = [],
      ...customerData
    } = createCustomerDto;

    const customer = new Customer();
    Object.assign(customer, {
      ...customerData,
      address: [],
      preferred_category: [],
      favorite_restaurants: [],
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000)
    });

    if (address_ids.length > 0) {
      const addresses = await this.addressRepository.findBy({
        id: In(address_ids)
      });
      customer.address = addresses;
    }

    if (preferred_category_ids.length > 0) {
      const categories = await this.foodCategoryRepository.findBy({
        id: In(preferred_category_ids)
      });
      customer.preferred_category = categories;
    }

    if (favorite_restaurant_ids.length > 0) {
      const restaurants = await this.restaurantRepository.findBy({
        id: In(favorite_restaurant_ids)
      });
      customer.favorite_restaurants = restaurants;
    }

    return await this.customerRepository.save(customer);
  }

  async findAll(): Promise<Customer[]> {
    return await this.customerRepository.find({
      relations: [
        'user',
        'address',
        'preferred_category',
        'favorite_restaurants'
      ]
    });
  }

  async findById(id: string): Promise<Customer> {
    return await this.customerRepository.findOne({
      where: { id },
      relations: [
        'user',
        'address',
        'preferred_category',
        'favorite_restaurants'
      ]
    });
  }

  async findByUserId(userId: string): Promise<Customer> {
    return await this.customerRepository.findOne({
      where: { user_id: userId },
      relations: [
        'user',
        'address',
        'preferred_category',
        'favorite_restaurants'
      ]
    });
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto
  ): Promise<Customer> {
    const customer = await this.findById(id);
    if (!customer) {
      return null;
    }

    const {
      address_ids,
      preferred_category_ids,
      favorite_restaurant_ids,
      ...updateData
    } = updateCustomerDto;

    if (address_ids?.length) {
      const addresses = await this.addressRepository.findBy({
        id: In(address_ids)
      });
      customer.address = addresses;
    }

    if (preferred_category_ids?.length) {
      const categories = await this.foodCategoryRepository.findBy({
        id: In(preferred_category_ids)
      });
      customer.preferred_category = categories;
    }

    if (favorite_restaurant_ids?.length) {
      const restaurants = await this.restaurantRepository.findBy({
        id: In(favorite_restaurant_ids)
      });
      customer.favorite_restaurants = restaurants;
    }

    Object.assign(customer, updateData);
    customer.updated_at = Math.floor(Date.now() / 1000);

    return await this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    await this.customerRepository.delete(id);
  }

  async findOneBy(conditions: Partial<Customer>): Promise<Customer | null> {
    return await this.customerRepository.findOne({
      where: conditions as unknown as FindOptionsWhere<Customer>,
      relations: [
        'user',
        'address',
        'preferred_category',
        'favorite_restaurants'
      ]
    });
  }
}
