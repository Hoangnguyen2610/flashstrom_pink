import { Injectable } from '@nestjs/common';
import { Repository, DeepPartial, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { FoodCategory } from '../food_categories/entities/food_category.entity';

@Injectable()
export class RestaurantsRepository {
  constructor(
    @InjectRepository(Restaurant)
    private repository: Repository<Restaurant>,
    @InjectRepository(FoodCategory)
    private foodCategoryRepository: Repository<FoodCategory>
  ) {}

  async create(createDto: CreateRestaurantDto): Promise<Restaurant> {
    // Handle food categories if provided
    let specialize_in: FoodCategory[] = [];
    if (createDto.food_category_ids?.length) {
      specialize_in = await this.foodCategoryRepository.findBy({
        id: In(createDto.food_category_ids)
      });
    }

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
      images_gallery: createDto.images_gallery,
      status: createDto.status,
      promotions: createDto.promotions,
      ratings: createDto.ratings,
      opening_hours: createDto.opening_hours,
      specialize_in,
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000)
    };

    const restaurant = this.repository.create(restaurantData);
    return await this.repository.save(restaurant);
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
    updateDto: UpdateRestaurantDto
  ): Promise<Restaurant> {
    // Handle food categories if provided
    let specialize_in: FoodCategory[] | undefined;
    if (updateDto.food_category_ids?.length) {
      specialize_in = await this.foodCategoryRepository.findBy({
        id: In(updateDto.food_category_ids)
      });
    }

    // Create a new object without food_category_ids
    const { ...updateDataWithoutFoodCategories } = updateDto;

    // Convert DTO to DeepPartial<Restaurant>
    const updateData: DeepPartial<Restaurant> = {
      ...updateDataWithoutFoodCategories,
      specialize_in,
      updated_at: Math.floor(Date.now() / 1000)
    };

    // Remove relationship fields that should not be directly updated
    delete updateData.address;
    delete updateData.owner;

    await this.repository.update(id, updateData);
    return await this.findById(id);
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
