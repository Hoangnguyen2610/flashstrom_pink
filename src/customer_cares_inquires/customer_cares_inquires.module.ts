import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerCareInquiriesService } from './customer_cares_inquires.service';
import { CustomerCareInquiriesController } from './customer_cares_inquires.controller';
import { CustomerCareInquiry } from './entities/customer_care_inquiry.entity';
import { CustomerCareInquiriesRepository } from './customer_cares_inquires.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerCareInquiry])],
  controllers: [CustomerCareInquiriesController],
  providers: [CustomerCareInquiriesService, CustomerCareInquiriesRepository],
  exports: [CustomerCareInquiriesService, CustomerCareInquiriesRepository]
})
export class CustomerCareInquiriesModule {}
