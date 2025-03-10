import { Injectable } from '@nestjs/common';
import { CreateFoodCategoryDto } from './dto/create-food_category.dto';
import { UpdateFoodCategoryDto } from './dto/update-food_category.dto';
import { FoodCategoriesRepository } from './food_categories.repository';
import { createResponse } from 'src/utils/createResponse';
import { ApiResponse } from 'src/utils/createResponse';
import { FoodCategory } from './entities/food_category.entity';

@Injectable()
export class FoodCategoriesService {
  constructor(
    private readonly foodCategoriesRepository: FoodCategoriesRepository
  ) {}

  async create(
    createFoodCategoryDto: CreateFoodCategoryDto
  ): Promise<ApiResponse<FoodCategory>> {
    try {
      const existingCategory = await this.foodCategoriesRepository.findByName(
        createFoodCategoryDto.name
      );

      if (existingCategory) {
        return createResponse(
          'DuplicatedRecord',
          null,
          'Food category with this name already exists'
        );
      }

      const newCategory = await this.foodCategoriesRepository.create(
        createFoodCategoryDto
      );
      return createResponse(
        'OK',
        newCategory,
        'Food category created successfully'
      );
    } catch (error) {
      console.error('Error creating food category:', error);
      return createResponse(
        'ServerError',
        null,
        'Error creating food category'
      );
    }
  }

  async findAll(): Promise<ApiResponse<FoodCategory[]>> {
    try {
      const categories = await this.foodCategoriesRepository.findAll();
      return createResponse('OK', categories, 'Fetched all food categories');
    } catch (error) {
      console.error('Error fetching food categories:', error);
      return createResponse(
        'ServerError',
        null,
        'Error fetching food categories'
      );
    }
  }

  async findOne(id: string): Promise<ApiResponse<FoodCategory>> {
    try {
      const category = await this.foodCategoriesRepository.findById(id);
      if (!category) {
        return createResponse('NotFound', null, 'Food category not found');
      }
      return createResponse(
        'OK',
        category,
        'Food category retrieved successfully'
      );
    } catch (error) {
      console.error('Error fetching food category:', error);
      return createResponse(
        'ServerError',
        null,
        'Error fetching food category'
      );
    }
  }

  async update(
    id: string,
    updateFoodCategoryDto: UpdateFoodCategoryDto
  ): Promise<ApiResponse<FoodCategory>> {
    try {
      const category = await this.foodCategoriesRepository.findById(id);
      if (!category) {
        return createResponse('NotFound', null, 'Food category not found');
      }

      const updatedCategory = await this.foodCategoriesRepository.update(
        id,
        updateFoodCategoryDto
      );
      return createResponse(
        'OK',
        updatedCategory,
        'Food category updated successfully'
      );
    } catch (error) {
      console.error('Error updating food category:', error);
      return createResponse(
        'ServerError',
        null,
        'Error updating food category'
      );
    }
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      const result = await this.foodCategoriesRepository.delete(id);
      if (!result) {
        return createResponse('NotFound', null, 'Food category not found');
      }
      return createResponse('OK', null, 'Food category deleted successfully');
    } catch (error) {
      console.error('Error deleting food category:', error);
      return createResponse(
        'ServerError',
        null,
        'Error deleting food category'
      );
    }
  }
}
