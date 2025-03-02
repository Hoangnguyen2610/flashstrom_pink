import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { AddressBook as AddressBookModule } from './address_book/address_book.module';
import { CustomersModule } from './customers/customers.module';
import { DriversModule } from './drivers/drivers.module';
import { UploadModule } from './upload/upload.module';
import { AuthModule } from './auth/auth.module'; // Make sure AuthModule is imported here
import { EmailService } from './mailer/email.service';
import { MailerCustomModule } from './mailer/mailer.module'; // Import MailerCustomModule (which configures MailerService)
import { FwalletsModule } from './fwallets/fwallets.module';
import { TransactionsModule } from './transactions/transactions.module';
import { FoodCategoriesModule } from './food_categories/food_categories.module';
import { PromotionsModule } from './promotions/promotions.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { MenuItemsModule } from './menu_items/menu_items.module';
import { MenuItemVariantsModule } from './menu_item_variants/menu_item_variants.module';
import { CartItemsModule } from './cart_items/cart_items.module';
import { OrdersModule } from './orders/orders.module';
import { RatingsReviewsModule } from './ratings_reviews/ratings_reviews.module';
import { AdminModule } from './admin/admin.module';
import { CustomerCaresModule } from './customer_cares/customer_cares.module';
import { FinanceAdminModule } from './admin/finance_admin/finance_admin.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DriverProgressStagesModule } from './driver_progress_stages/driver_progress_stages.module';
import { CompanionAdminModule } from './admin/companion_admin/companion_admin.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI), // Your MongoDB URI
    UserModule,
    AddressBookModule,
    EventEmitterModule.forRoot(),
    CustomersModule,
    DriversModule,
    UploadModule,
    AuthModule, // Ensure AuthModule is imported
    MailerCustomModule,
    FwalletsModule,
    TransactionsModule,
    FoodCategoriesModule,
    PromotionsModule,
    RestaurantsModule,
    MenuItemsModule,
    MenuItemVariantsModule,
    CartItemsModule,
    OrdersModule,
    RatingsReviewsModule, // Import the mailer module here
    AdminModule,
    CustomerCaresModule,
    FinanceAdminModule,
    DriverProgressStagesModule,
    CompanionAdminModule
  ],
  controllers: [AppController],
  providers: [AppService, EmailService]
})
export class AppModule {}
