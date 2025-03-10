import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { Promotion } from './entities/promotion.entity';
import { PromotionsRepository } from './promotions.repository';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity';
import { FoodCategoriesRepository } from 'src/food_categories/food_categories.repository';
@Module({
  imports: [TypeOrmModule.forFeature([Promotion, FoodCategory])],
  controllers: [PromotionsController],
  providers: [
    PromotionsService,
    PromotionsRepository,
    FoodCategoriesRepository
  ],
  exports: [PromotionsService, PromotionsRepository]
})
export class PromotionsModule {}
