import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { CustomersModule } from 'src/customers/customers.module';
import { DriversModule } from 'src/drivers/drivers.module';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { DriversService } from 'src/drivers/drivers.service';
import { CustomersService } from 'src/customers/customers.service';
import { MenuItemsModule } from 'src/menu_items/menu_items.module';
import { MenuItemsService } from 'src/menu_items/menu_items.service';
import { FoodCategoriesModule } from 'src/food_categories/food_categories.module';
import { MenuItemVariantsModule } from 'src/menu_item_variants/menu_item_variants.module';
import { OrdersModule } from 'src/orders/orders.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from 'src/users/users.repository';
import { PromotionsService } from 'src/promotions/promotions.service';
import { PromotionsRepository } from 'src/promotions/promotions.repository';
import { Promotion } from 'src/promotions/entities/promotion.entity';
import { AddressBook } from 'src/address_book/entities/address_book.entity';
import { AddressBookRepository } from 'src/address_book/address_book.repository';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity';
import { FoodCategoriesRepository } from 'src/food_categories/food_categories.repository';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { RestaurantsRepository } from 'src/restaurants/restaurants.repository';
import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersRepository } from 'src/customers/customers.repository';
import { Driver } from 'src/drivers/entities/driver.entity';
import { DriversRepository } from 'src/drivers/drivers.repository';
import { DriversGateway } from 'src/drivers/drivers.gateway';
import { DriverProgressStagesService } from 'src/driver_progress_stages/driver_progress_stages.service';
import { DriverProgressStagesModule } from 'src/driver_progress_stages/driver_progress_stages.module';
import { MenuItem } from 'src/menu_items/entities/menu_item.entity';
import { MenuItemVariant } from 'src/menu_item_variants/entities/menu_item_variant.entity';
import { MenuItemVariantsRepository } from 'src/menu_item_variants/menu_item_variants.repository';
import { MenuItemsRepository } from 'src/menu_items/menu_items.repository';
import { Order } from 'src/orders/entities/order.entity';
import { OrdersRepository } from 'src/orders/orders.repository';
import { CustomerCareInquiry } from 'src/customer_cares_inquires/entities/customer_care_inquiry.entity';
import { DriverProgressStage } from 'src/driver_progress_stages/entities/driver_progress_stage.entity';
import { DriverProgressStagesRepository } from 'src/driver_progress_stages/driver_progress_stages.repository';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Promotion,
      AddressBook,
      FoodCategory,
      Restaurant,
      Customer,
      Driver,
      MenuItem,
      MenuItemVariant,
      Order,
      DriverProgressStage,
      CustomerCareInquiry
    ]),
    CustomersModule,
    DriversModule,
    RestaurantsModule,
    MenuItemsModule,
    FoodCategoriesModule,
    MenuItemVariantsModule,
    DriverProgressStagesModule,
    OrdersModule
  ],
  controllers: [UploadController],
  providers: [
    UploadService,
    RestaurantsService,
    DriversService,
    MenuItemsService,
    CustomersService,
    UserRepository,
    PromotionsService,
    PromotionsRepository,
    AddressBookRepository,
    FoodCategoriesRepository,
    DriverProgressStagesRepository,
    RestaurantsRepository,
    CustomersRepository,
    DriversRepository,
    DriversGateway,
    DriverProgressStagesService,
    MenuItemsRepository,
    MenuItemVariantsRepository,
    OrdersRepository
  ]
})
export class UploadModule {}
