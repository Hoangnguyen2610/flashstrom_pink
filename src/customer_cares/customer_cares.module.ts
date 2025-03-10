import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerCareService } from './customer_cares.service';
import { CustomerCareController } from './customer_cares.controller';
import { CustomerCare } from './entities/customer_care.entity';
import { CustomerCaresRepository } from './customer_cares.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerCare])],
  controllers: [CustomerCareController],
  providers: [CustomerCareService, CustomerCaresRepository],
  exports: [CustomerCareService, CustomerCaresRepository]
})
export class CustomerCaresModule {}
