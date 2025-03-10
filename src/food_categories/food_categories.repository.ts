import { Injectable } from '@nestjs/common';
import { Repository, In } from 'typeorm'; // Thêm In
import { InjectRepository } from '@nestjs/typeorm';
import { FoodCategory } from './entities/food_category.entity';
import { CreateFoodCategoryDto } from './dto/create-food_category.dto';
import { UpdateFoodCategoryDto } from './dto/update-food_category.dto';

@Injectable()
export class FoodCategoriesRepository {
  constructor(
    @InjectRepository(FoodCategory)
    private repository: Repository<FoodCategory>
  ) {}

  async create(createDto: CreateFoodCategoryDto): Promise<FoodCategory> {
    const category = this.repository.create(createDto);
    return await this.repository.save(category);
  }

  async findAll(): Promise<FoodCategory[]> {
    return await this.repository.find();
  }

  async findById(id: string): Promise<FoodCategory> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<FoodCategory[]> {
    return await this.repository.find({
      where: { id: In(ids) } // Tìm nhiều bản ghi theo mảng ids
    });
  }

  async findByName(name: string): Promise<FoodCategory> {
    return await this.repository.findOne({ where: { name } });
  }

  async update(
    id: string,
    updateDto: UpdateFoodCategoryDto
  ): Promise<FoodCategory> {
    await this.repository.update(id, {
      ...updateDto,
      updated_at: Math.floor(Date.now() / 1000)
    });
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}
