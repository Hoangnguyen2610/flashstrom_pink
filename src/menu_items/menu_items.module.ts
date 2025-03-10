import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from './entities/menu_item.entity';
import { MenuItemsController } from './menu_items.controller';
import { MenuItemsService } from './menu_items.service';
import { MenuItemsRepository } from './menu_items.repository';
import { FoodCategoriesModule } from 'src/food_categories/food_categories.module';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import { MenuItemVariantsModule } from 'src/menu_item_variants/menu_item_variants.module';
import { MenuItemVariantsService } from 'src/menu_item_variants/menu_item_variants.service';
import { MenuItemVariant } from 'src/menu_item_variants/entities/menu_item_variant.entity';
import { FoodCategoriesRepository } from 'src/food_categories/food_categories.repository';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity';
import { CartItemsModule } from 'src/cart_items/cart_items.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([MenuItem, MenuItemVariant, FoodCategory]),
    forwardRef(() => FoodCategoriesModule),
    forwardRef(() => RestaurantsModule),
    forwardRef(() => MenuItemVariantsModule),
    forwardRef(() => CartItemsModule)
  ],
  controllers: [MenuItemsController],
  providers: [
    MenuItemsService,
    MenuItemsRepository,
    MenuItemVariantsService,
    FoodCategoriesRepository
  ],
  exports: [MenuItemsService, MenuItemsRepository]
})
export class MenuItemsModule {}
