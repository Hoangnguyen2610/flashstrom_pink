import { Module } from '@nestjs/common';
import { CustomerCareService } from './customer_cares.service';
import { CustomerCareController } from './customer_cares.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerCareSchema } from './customer_cares.schema';
import { UserSchema } from 'src/user/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'CustomerCare', schema: CustomerCareSchema },
    ]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [CustomerCareController],
  providers: [CustomerCareService],
  exports: [CustomerCareService],
})
export class CustomerCaresModule {}
