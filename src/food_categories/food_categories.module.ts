import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodCategoriesService } from './food_categories.service';
import { FoodCategoriesController } from './food_categories.controller';
import { FoodCategory } from './entities/food_category.entity';
import { FoodCategoriesRepository } from './food_categories.repository';

@Module({
  imports: [TypeOrmModule.forFeature([FoodCategory])],
  controllers: [FoodCategoriesController],
  providers: [FoodCategoriesService, FoodCategoriesRepository],
  exports: [FoodCategoriesService]
})
export class FoodCategoriesModule {}
