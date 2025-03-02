import { Module } from '@nestjs/common';
import { CompanionAdminController } from './companion_admin.controller';
import { AdminModule } from '../admin.module';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';

@Module({
  imports: [AdminModule, RestaurantsModule],
  controllers: [CompanionAdminController]
})
export class CompanionAdminModule {}
