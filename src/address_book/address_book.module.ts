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
@Module({
  imports: [
    TypeOrmModule.forFeature([AddressBook, Customer, FoodCategory, Restaurant])
  ],
  controllers: [AddressBookController],
  providers: [
    AddressBookService,
    AddressBookRepository,
    CustomersRepository,
    FoodCategoriesRepository,
    RestaurantsRepository
  ],
  exports: [AddressBookService]
})
export class AddressBookModule {}
