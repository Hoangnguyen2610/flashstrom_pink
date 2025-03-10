import { Injectable } from '@nestjs/common';
import { Repository, DeepPartial } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { FoodCategory } from '../food_categories/entities/food_category.entity';
import { createResponse } from 'src/utils/createResponse';
import { UserRepository } from 'src/users/users.repository';
import { AddressBookRepository } from 'src/address_book/address_book.repository';

@Injectable()
export class RestaurantsRepository {
  constructor(
    @InjectRepository(Restaurant)
    public repository: Repository<Restaurant>,
    @InjectRepository(FoodCategory)
    private foodCategoryRepository: Repository<FoodCategory>,
    private userRepository: UserRepository,
    private addressRepository: AddressBookRepository
  ) {}

  async create(
    createDto: CreateRestaurantDto & { specialize_in?: FoodCategory[] }
  ): Promise<any> {
    const owner = await this.userRepository.findById(createDto.owner_id);
    if (!owner) {
      return createResponse('NotFound', null, 'Owner not found');
    }

    // Check if address exists
    const address = await this.addressRepository.findById(createDto.address_id);
    if (!address) {
      return createResponse('NotFound', null, 'Address not found');
    }

    // Sử dụng specialize_in từ DTO (đã được RestaurantsService xử lý)
    const specialize_in = createDto.specialize_in || [];

    // Convert DTO to DeepPartial<Restaurant>
    const restaurantData: DeepPartial<Restaurant> = {
      owner_id: createDto.owner_id,
      owner_name: createDto.owner_name,
      address_id: createDto.address_id,
      restaurant_name: createDto.restaurant_name,
      description: createDto.description,
      contact_email: createDto.contact_email,
      contact_phone: createDto.contact_phone,
      avatar: createDto.avatar,
      images_gallery: createDto.images_gallery || [],
      status: createDto.status,
      promotions: createDto.promotions || [],
      ratings: createDto.ratings,
      opening_hours: createDto.opening_hours,
      specialize_in, // Sử dụng specialize_in từ DTO
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000)
    };

    const restaurant = this.repository.create(restaurantData);
    const savedRestaurant = await this.repository.save(restaurant, {
      reload: true
    });

    return savedRestaurant;
  }

  async findAll(): Promise<Restaurant[]> {
    return await this.repository.find({
      relations: ['owner', 'address', 'specialize_in']
    });
  }

  async findById(id: string): Promise<Restaurant> {
    return await this.repository.findOne({
      where: { id },
      relations: ['owner', 'address', 'specialize_in']
    });
  }

  async findByOwnerId(ownerId: string): Promise<Restaurant> {
    return await this.repository.findOne({
      where: { owner_id: ownerId },
      relations: ['owner', 'address', 'specialize_in']
    });
  }

  async update(
    id: string,
    updateDto: UpdateRestaurantDto & { specialize_in?: FoodCategory[] }
  ): Promise<Restaurant> {
    const specialize_in = updateDto.specialize_in; // Lấy specialize_in từ DTO

    const updateData: DeepPartial<Restaurant> = {
      ...updateDto,
      updated_at: Math.floor(Date.now() / 1000)
    };

    // Remove relationship fields that should not be directly updated
    delete updateData.address;
    delete updateData.owner;
    delete updateData.specialize_in; // Xóa specialize_in khỏi updateData vì sẽ xử lý riêng

    // Đảm bảo images_gallery và promotions không bị null
    if (updateData.images_gallery === undefined) {
      delete updateData.images_gallery;
    }
    if (updateData.promotions === undefined) {
      delete updateData.promotions;
    }

    await this.repository.update(id, updateData);
    const updatedRestaurant = await this.findById(id);

    // Cập nhật quan hệ ManyToMany nếu có
    if (specialize_in && specialize_in.length > 0) {
      updatedRestaurant.specialize_in = specialize_in;
      await this.repository.save(updatedRestaurant);
    }

    return updatedRestaurant;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  async findByCondition(condition: any): Promise<Restaurant> {
    return await this.repository.findOne({
      where: condition,
      relations: ['owner', 'address', 'specialize_in']
    });
  }
}
