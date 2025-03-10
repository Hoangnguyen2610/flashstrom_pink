import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FWallet } from './entities/fwallet.entity';
import { FWalletService } from './fwallets.service';
import { FWalletController } from './fwallets.controller';
import { FWalletsRepository } from './fwallets.repository';

@Module({
  imports: [TypeOrmModule.forFeature([FWallet])],
  controllers: [FWalletController],
  providers: [FWalletService, FWalletsRepository],
  exports: [FWalletService]
})
export class FwalletsModule {}
