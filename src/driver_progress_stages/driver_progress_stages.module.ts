import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverProgressStagesService } from './driver_progress_stages.service';
import { DriverProgressStagesController } from './driver_progress_stages.controller';
import { DriverProgressStage } from './entities/driver_progress_stage.entity';
import { DriverProgressStagesRepository } from './driver_progress_stages.repository';
import { DriversRepository } from 'src/drivers/drivers.repository';
import { DriversModule } from 'src/drivers/drivers.module';
import { Driver } from 'src/drivers/entities/driver.entity';
import { Order } from 'src/orders/entities/order.entity';
import { OrdersRepository } from 'src/orders/orders.repository';
import { PromotionsRepository } from 'src/promotions/promotions.repository';
import { Promotion } from 'src/promotions/entities/promotion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverProgressStage, Driver, Order, Promotion]),
    forwardRef(() => DriversModule)
  ],
  controllers: [DriverProgressStagesController],
  providers: [
    DriverProgressStagesService,
    DriverProgressStagesRepository,
    DriversRepository,
    PromotionsRepository,
    OrdersRepository
  ],
  exports: [DriverProgressStagesService, DriverProgressStagesRepository]
})
export class DriverProgressStagesModule {}
