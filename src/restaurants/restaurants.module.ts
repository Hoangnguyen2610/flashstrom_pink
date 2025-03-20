import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsGateway } from './restaurants.gateway';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantsRepository } from './restaurants.repository';
import { DriversModule } from 'src/drivers/drivers.module';
import { MenuItemsModule } from 'src/menu_items/menu_items.module';
import { MenuItemVariantsModule } from 'src/menu_item_variants/menu_item_variants.module';
import { OrdersModule } from 'src/orders/orders.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UsersModule } from 'src/users/users.module';
import { PromotionsModule } from 'src/promotions/promotions.module';
import { FoodCategoriesModule } from 'src/food_categories/food_categories.module';
import { AddressBookModule } from 'src/address_book/address_book.module';
import { AddressBook } from 'src/address_book/entities/address_book.entity';
import { AddressBookRepository } from 'src/address_book/address_book.repository';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity';
import { FoodCategoriesRepository } from 'src/food_categories/food_categories.repository';
import { CartItemsModule } from 'src/cart_items/cart_items.module';
import { Order } from 'src/orders/entities/order.entity';
import { OrdersRepository } from 'src/orders/orders.repository';
import { UserRepository } from 'src/users/users.repository';
import { User } from 'src/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { TransactionService } from 'src/transactions/transactions.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { FWallet } from 'src/fwallets/entities/fwallet.entity';
import { FWalletsRepository } from 'src/fwallets/fwallets.repository';
import { TransactionsRepository } from 'src/transactions/transactions.repository';
import { PromotionsRepository } from 'src/promotions/promotions.repository';
import { Promotion } from 'src/promotions/entities/promotion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      AddressBook,
      Transaction,
      FoodCategory,
      Promotion,
      Order,
      FWallet,
      User
    ]),
    UsersModule,
    AddressBookModule,
    forwardRef(() => DriversModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => MenuItemsModule),
    forwardRef(() => MenuItemVariantsModule),
    forwardRef(() => CartItemsModule),
    PromotionsModule,
    FoodCategoriesModule,
    EventEmitterModule.forRoot()
  ],
  controllers: [RestaurantsController],
  providers: [
    RestaurantsService,
    RestaurantsRepository,
    RestaurantsGateway,
    AddressBookRepository,
    FoodCategoriesRepository,
    UserRepository,
    AddressBookRepository,
    OrdersRepository,
    JwtService,
    TransactionService,
    FWalletsRepository,
    TransactionsRepository,
    PromotionsRepository
  ],
  exports: [
    RestaurantsService,
    RestaurantsRepository,
    RestaurantsGateway,
    AddressBookRepository
  ]
})
export class RestaurantsModule {}
