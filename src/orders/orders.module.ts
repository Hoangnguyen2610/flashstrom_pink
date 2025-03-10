import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersGateway } from './orders.gateway';
import { Order } from './entities/order.entity';
import { OrdersRepository } from './orders.repository';
import { MenuItemsRepository } from 'src/menu_items/menu_items.repository';
import { MenuItemVariantsRepository } from 'src/menu_item_variants/menu_item_variants.repository';
import { MenuItem } from 'src/menu_items/entities/menu_item.entity';
import { MenuItemVariant } from 'src/menu_item_variants/entities/menu_item_variant.entity';
import { AddressBook } from 'src/address_book/entities/address_book.entity';
import { AddressBookRepository } from 'src/address_book/address_book.repository';
import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersRepository } from 'src/customers/customers.repository';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { RestaurantsRepository } from 'src/restaurants/restaurants.repository';
import { RestaurantsGateway } from 'src/restaurants/restaurants.gateway';
import { FoodCategoriesRepository } from 'src/food_categories/food_categories.repository';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity';
import { Driver } from 'src/drivers/entities/driver.entity';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { DriversService } from 'src/drivers/drivers.service';
import { DriversGateway } from 'src/drivers/drivers.gateway';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from 'src/users/users.repository';
import { Promotion } from 'src/promotions/entities/promotion.entity';
import { PromotionsRepository } from 'src/promotions/promotions.repository';
import { MenuItemsService } from 'src/menu_items/menu_items.service';
import { MenuItemVariantsService } from 'src/menu_item_variants/menu_item_variants.service';
import { DriversRepository } from 'src/drivers/drivers.repository';
import { DriverProgressStagesService } from 'src/driver_progress_stages/driver_progress_stages.service';
import { DriverProgressStage } from 'src/driver_progress_stages/entities/driver_progress_stage.entity';
import { DriverProgressStagesRepository } from 'src/driver_progress_stages/driver_progress_stages.repository';
import { CartItem } from 'src/cart_items/entities/cart_item.entity';
import { CartItemsRepository } from 'src/cart_items/cart_items.repository';
import { DriversModule } from 'src/drivers/drivers.module'; // Đảm bảo import
import { CustomersGateway } from 'src/customers/customers.gateway';
import { CustomersService } from 'src/customers/customers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      MenuItem,
      MenuItemVariant,
      AddressBook,
      Restaurant,
      Customer,
      FoodCategory,
      Driver, // Cung cấp Repository<Driver>
      User,
      Promotion,
      DriverProgressStage,
      CartItem
    ]),
    forwardRef(() => DriversModule) // Tham chiếu đến DriversModule
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersRepository,
    OrdersGateway,
    MenuItemsRepository,
    MenuItemVariantsRepository,
    AddressBookRepository,
    CustomersRepository,
    RestaurantsRepository,
    RestaurantsGateway,
    FoodCategoriesRepository,
    RestaurantsService,
    DriversService,
    DriversGateway,
    UserRepository,
    CustomersService,
    DriversRepository,
    PromotionsRepository,
    MenuItemsService,
    DriverProgressStagesService,
    MenuItemVariantsService,
    DriverProgressStagesRepository,
    CartItemsRepository,
    CustomersGateway
  ],
  exports: [OrdersService]
})
export class OrdersModule {}
