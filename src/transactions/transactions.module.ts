import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { TransactionsRepository } from './transactions.repository';
import { UsersModule } from 'src/users/users.module';
import { FwalletsModule } from 'src/fwallets/fwallets.module';
import { User } from 'src/users/entities/user.entity';
import { FWallet } from 'src/fwallets/entities/fwallet.entity';
import { FWalletsRepository } from 'src/fwallets/fwallets.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, User, FWallet]),
    UsersModule,
    FwalletsModule
  ],
  controllers: [TransactionsController],
  providers: [TransactionService, TransactionsRepository, FWalletsRepository],
  exports: [TransactionService, TransactionsRepository]
})
export class TransactionsModule {}
