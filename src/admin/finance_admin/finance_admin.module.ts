import { Module } from '@nestjs/common';
import { FinanceAdminController } from './finance_admin.controller';
import { AdminModule } from '../admin.module';
import { PromotionsModule } from '../../promotions/promotions.module';

@Module({
  imports: [AdminModule, PromotionsModule],
  controllers: [FinanceAdminController]
})
export class FinanceAdminModule {}
