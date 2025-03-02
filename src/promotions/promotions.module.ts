import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromotionSchema } from './promotions.schema';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Promotion', schema: PromotionSchema }]) // Register Promotion schema
  ],
  providers: [PromotionsService],
  controllers: [PromotionsController],

  exports: [MongooseModule, PromotionsService], // Export MongooseModule to make the Promotion model available

})
export class PromotionsModule {}
