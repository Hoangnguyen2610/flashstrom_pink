import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { CustomersModule } from 'src/customers/customers.module';
import { AuthController } from './auth.controller';
import { EmailService } from 'src/mailer/email.service';
import { MailerCustomModule } from 'src/mailer/mailer.module';
import { DriversModule } from 'src/drivers/drivers.module';
import { DriversService } from 'src/drivers/drivers.service';
import { FWalletService } from 'src/fwallets/fwallets.service';
import { FwalletsModule } from 'src/fwallets/fwallets.module';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { PromotionsModule } from 'src/promotions/promotions.module';
import { AddressBookService } from 'src/address_book/address_book.service';
import { PromotionsService } from 'src/promotions/promotions.service';
import { MenuItemsService } from 'src/menu_items/menu_items.service';
import { MenuItemsModule } from 'src/menu_items/menu_items.module';
import { FoodCategoriesModule } from 'src/food_categories/food_categories.module';
import { MenuItemVariantsService } from 'src/menu_item_variants/menu_item_variants.service';
import { MenuItemVariantsModule } from 'src/menu_item_variants/menu_item_variants.module';
import { CartItemsModule } from 'src/cart_items/cart_items.module';
import { CartItemsService } from 'src/cart_items/cart_items.service';
import { OrdersModule } from 'src/orders/orders.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Admin } from '../admin/entities/admin.entity';
import { UsersService } from 'src/users/users.service';
import { UserRepository } from 'src/users/users.repository';
import { Promotion } from 'src/promotions/entities/promotion.entity';
import { AddressBook } from 'src/address_book/entities/address_book.entity';
import { AddressBookRepository } from 'src/address_book/address_book.repository';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity';
import { FoodCategoriesRepository } from 'src/food_categories/food_categories.repository';
import { FWallet } from 'src/fwallets/entities/fwallet.entity';
import { FWalletsRepository } from 'src/fwallets/fwallets.repository';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersRepository } from 'src/customers/customers.repository';
import { Driver } from 'src/drivers/entities/driver.entity';
import { DriversRepository } from 'src/drivers/drivers.repository';
import { MenuItemVariant } from 'src/menu_item_variants/entities/menu_item_variant.entity';
import { MenuItem } from 'src/menu_items/entities/menu_item.entity';
import { MenuItemVariantsRepository } from 'src/menu_item_variants/menu_item_variants.repository';
import { MenuItemsRepository } from 'src/menu_items/menu_items.repository';
import { Order } from 'src/orders/entities/order.entity';
import { OrdersRepository } from 'src/orders/orders.repository';
import { CartItem } from 'src/cart_items/entities/cart_item.entity';
import { CartItemsRepository } from 'src/cart_items/cart_items.repository';
import { CustomerCaresRepository } from 'src/customer_cares/customer_cares.repository';
import { CustomerCare } from 'src/customer_cares/entities/customer_care.entity';
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' }
    }),
    TypeOrmModule.forFeature([
      User,
      Admin,
      Promotion,
      AddressBook,
      FoodCategory,
      Customer,
      FWallet,
      Driver,
      Restaurant,
      MenuItem,
      MenuItemVariant,
      Order,
      CartItem,
      CustomerCare
    ]),

    // Add Mongoose models
    CustomersModule,
    DriversModule,
    FwalletsModule,
    RestaurantsModule,
    PromotionsModule,
    MenuItemsModule,
    MenuItemVariantsModule,
    CartItemsModule,
    FoodCategoriesModule,
    MailerCustomModule,
    OrdersModule
  ],
  providers: [
    AuthService,
    JwtStrategy,
    EmailService,
    UsersService,
    DriversService,
    FWalletService,
    RestaurantsService,
    AddressBookService,
    CartItemsService,
    PromotionsService,
    MenuItemsService,
    MenuItemVariantsService,
    UserRepository,
    AddressBookRepository,
    FoodCategoriesRepository,
    FWalletsRepository,
    DriversRepository,
    CustomersRepository,
    MenuItemsRepository,
    MenuItemVariantsRepository,
    OrdersRepository,
    CartItemsRepository,
    CustomerCaresRepository
  ],
  controllers: [AuthController],
  exports: [AuthService, EmailService]
})
export class AuthModule {}
