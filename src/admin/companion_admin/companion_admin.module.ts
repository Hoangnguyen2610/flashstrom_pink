import { Module } from '@nestjs/common';
import { CompanionAdminController } from './companion_admin.controller';
import { AdminModule } from '../admin.module';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import { CustomersModule } from 'src/customers/customers.module';
import { DriversModule } from 'src/drivers/drivers.module';
import { CustomerCaresModule } from 'src/customer_cares/customer_cares.module';

@Module({
  imports: [
    AdminModule,
    RestaurantsModule,
    CustomersModule,
    DriversModule,
    CustomerCaresModule
  ],
  controllers: [CompanionAdminController]
})
export class CompanionAdminModule {}
