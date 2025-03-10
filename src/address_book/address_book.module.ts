import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressBookService } from './address_book.service';
import { AddressBookController } from './address_book.controller';
import { AddressBook } from './entities/address_book.entity';
import { AddressBookRepository } from './address_book.repository';
import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersRepository } from 'src/customers/customers.repository';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity';
import { FoodCategoriesRepository } from 'src/food_categories/food_categories.repository';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { RestaurantsRepository } from 'src/restaurants/restaurants.repository';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from 'src/users/users.repository';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AddressBook,
      Customer,
      FoodCategory,
      Restaurant,
      User
    ])
  ],
  controllers: [AddressBookController],
  providers: [
    AddressBookService,
    AddressBookRepository,
    CustomersRepository,
    FoodCategoriesRepository,
    RestaurantsRepository,
    UserRepository
  ],
  exports: [AddressBookService]
})
export class AddressBookModule {}
