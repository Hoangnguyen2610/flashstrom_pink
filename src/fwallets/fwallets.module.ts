import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FWallet } from './entities/fwallet.entity';
import { FWalletService } from './fwallets.service';
import { FWalletController } from './fwallets.controller';
import { FWalletsRepository } from './fwallets.repository';
import { TransactionsRepository } from 'src/transactions/transactions.repository';
import { Transaction } from 'src/transactions/entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FWallet, Transaction])],
  controllers: [FWalletController],
  providers: [FWalletService, FWalletsRepository, TransactionsRepository],
  exports: [FWalletService]
})
export class FwalletsModule {}
