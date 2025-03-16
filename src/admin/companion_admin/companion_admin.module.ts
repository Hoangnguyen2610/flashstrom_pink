import { Module } from '@nestjs/common';
import { CompanionAdminController } from './companion_admin.controller';
import { AdminModule } from '../admin.module';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import { CustomersModule } from 'src/customers/customers.module';
import { DriversModule } from 'src/drivers/drivers.module';
import { CustomerCaresModule } from 'src/customer_cares/customer_cares.module';
import { AuthService } from 'src/auth/auth.service';
import { AdminService } from '../admin.service';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { CustomerCareService } from 'src/customer_cares/customer_cares.service';
import { DriversService } from 'src/drivers/drivers.service';
import { CustomersService } from 'src/customers/customers.service';
import { RestaurantsRepository } from 'src/restaurants/restaurants.repository';
import { DriversRepository } from 'src/drivers/drivers.repository';
import { CustomersRepository } from 'src/customers/customers.repository';
import { CustomerCaresRepository } from 'src/customer_cares/customer_cares.repository';
import { JwtService } from '@nestjs/jwt';
import { CartItemsService } from 'src/cart_items/cart_items.service';
import { UserRepository } from 'src/users/users.repository';
import { FWalletsRepository } from 'src/fwallets/fwallets.repository';
import { UsersService } from 'src/users/users.service';
import { PromotionsRepository } from 'src/promotions/promotions.repository';
import { MenuItemsRepository } from 'src/menu_items/menu_items.repository';
import { MenuItemVariantsRepository } from 'src/menu_item_variants/menu_item_variants.repository';
import { CartItemsRepository } from 'src/cart_items/cart_items.repository';
import { FoodCategoriesRepository } from 'src/food_categories/food_categories.repository';
import { OrdersRepository } from 'src/orders/orders.repository';
import { MenuItemsService } from 'src/menu_items/menu_items.service';
import { MenuItemVariantsService } from 'src/menu_item_variants/menu_item_variants.service';
import { AddressBookRepository } from 'src/address_book/address_book.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from 'src/drivers/entities/driver.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { CustomerCare } from 'src/customer_cares/entities/customer_care.entity';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity';
import { MenuItem } from 'src/menu_items/entities/menu_item.entity';
import { MenuItemVariant } from 'src/menu_item_variants/entities/menu_item_variant.entity';
import { Order } from 'src/orders/entities/order.entity';
import { CartItem } from 'src/cart_items/entities/cart_item.entity';
import { AddressBook } from 'src/address_book/entities/address_book.entity';
import { User } from 'src/users/entities/user.entity';
import { FWallet } from 'src/fwallets/entities/fwallet.entity';
import { Promotion } from 'src/promotions/entities/promotion.entity';
import { DriverProgressStagesRepository } from 'src/driver_progress_stages/driver_progress_stages.repository';
import { DriverProgressStage } from 'src/driver_progress_stages/entities/driver_progress_stage.entity';
import { AddressBookService } from 'src/address_book/address_book.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Driver,
      Restaurant,
      Customer,
      CustomerCare,
      FoodCategory,
      MenuItem,
      MenuItemVariant,
      Order,
      CartItem,
      FoodCategory,
      AddressBook,
      User,
      FWallet,
      Promotion,
      DriverProgressStage
    ]),
    AdminModule,
    RestaurantsModule,
    CustomersModule,
    DriversModule,
    CustomerCaresModule
  ],
  controllers: [CompanionAdminController],
  providers: [
    AuthService,
    AdminService,
    RestaurantsService,
    CustomerCareService,
    DriversService,
    AddressBookService,
    CustomersService,
    RestaurantsRepository,
    CustomersRepository,
    CustomerCaresRepository,
    JwtService,
    CartItemsService,
    UserRepository,
    FWalletsRepository,
    UsersService,
    PromotionsRepository,
    MenuItemsRepository,
    MenuItemVariantsRepository,
    CartItemsRepository,
    DriverProgressStagesRepository,
    FoodCategoriesRepository,
    OrdersRepository,
    MenuItemsService,
    MenuItemVariantsService,
    AddressBookRepository,
    DriversRepository
  ]
})
export class CompanionAdminModule {}
