import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { createResponse } from 'src/utils/createResponse';
import { ApiResponse } from 'src/utils/createResponse';
import { UserRepository } from 'src/users/users.repository';
import { FWalletsRepository } from 'src/fwallets/fwallets.repository';
import { TransactionsRepository } from './transactions.repository';
import { FWallet } from 'src/fwallets/entities/fwallet.entity';

@Injectable()
export class TransactionService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly userRepository: UserRepository,
    private readonly fWalletsRepository: FWalletsRepository
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto
  ): Promise<ApiResponse<Transaction>> {
    try {
      const validationResult =
        await this.validateTransaction(createTransactionDto);
      if (validationResult !== true) {
        return validationResult;
      }

      const { transaction_type, amount, source, destination } =
        createTransactionDto;

      if (transaction_type === 'WITHDRAW' || transaction_type === 'PURCHASE') {
        const sourceWallet = await this.fWalletsRepository.findByUserId(source);
        await this.handleSourceWalletTransaction(sourceWallet, amount);
      }

      if (transaction_type === 'DEPOSIT' || transaction_type === 'PURCHASE') {
        await this.handleDestinationWalletTransaction(destination, amount);
      }

      const newTransaction =
        await this.transactionsRepository.create(createTransactionDto);
      return createResponse(
        'OK',
        newTransaction,
        'Transaction created successfully'
      );
    } catch (error) {
      return this.handleError('Error creating transaction:', error);
    }
  }

  async findAll(): Promise<ApiResponse<Transaction[]>> {
    try {
      const transactions = await this.transactionsRepository.findAll();
      return createResponse('OK', transactions, 'Fetched all transactions');
    } catch (error) {
      return this.handleError('Error fetching transactions:', error);
    }
  }

  async findTransactionById(id: string): Promise<ApiResponse<Transaction>> {
    try {
      const transaction = await this.transactionsRepository.findById(id);
      return this.handleTransactionResponse(transaction);
    } catch (error) {
      return this.handleError('Error fetching transaction:', error);
    }
  }

  async findOne(conditions: object): Promise<ApiResponse<Transaction>> {
    try {
      const transaction =
        await this.transactionsRepository.findByCondition(conditions);
      return this.handleTransactionResponse(transaction);
    } catch (error) {
      return this.handleError('Error fetching transaction:', error);
    }
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto
  ): Promise<ApiResponse<Transaction>> {
    try {
      const updatedTransaction = await this.transactionsRepository.update(
        id,
        updateTransactionDto
      );
      return this.handleTransactionResponse(updatedTransaction);
    } catch (error) {
      return this.handleError('Error updating transaction:', error);
    }
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      const result = await this.transactionsRepository.remove(id);
      if (!result) {
        return createResponse('NotFound', null, 'Transaction not found');
      }
      return createResponse('OK', null, 'Transaction deleted successfully');
    } catch (error) {
      return this.handleError('Error deleting transaction:', error);
    }
  }

  // Private helper methods
  private async validateTransaction(
    createTransactionDto: CreateTransactionDto
  ): Promise<true | ApiResponse<null>> {
    const { user_id, transaction_type, amount, source } = createTransactionDto;

    const userResponse = await this.userRepository.findById(user_id);
    if (!userResponse) {
      return createResponse('NotFound', null, 'User not found');
    }

    if (transaction_type === 'WITHDRAW' || transaction_type === 'PURCHASE') {
      const sourceWallet = await this.fWalletsRepository.findByUserId(source);
      if (!sourceWallet) {
        return createResponse('NotFound', null, 'Source wallet not found');
      }

      if (sourceWallet.balance < +amount) {
        return createResponse(
          'InsufficientBalance',
          null,
          'Insufficient balance in the source wallet'
        );
      }
    }

    return true;
  }

  private async handleSourceWalletTransaction(
    sourceWallet: FWallet,
    amount: number
  ): Promise<void> {
    sourceWallet.balance -= +amount;
    await this.fWalletsRepository.update(sourceWallet.id, {
      balance: sourceWallet.balance
    });
  }

  private async handleDestinationWalletTransaction(
    destination: string,
    amount: number
  ): Promise<void> {
    const destinationWallet =
      await this.fWalletsRepository.findByUserId(destination);

    if (destinationWallet) {
      destinationWallet.balance += +amount;
      await this.fWalletsRepository.update(destinationWallet.id, {
        balance: destinationWallet.balance
      });
    } else {
      const destinationUser = await this.userRepository.findById(destination);
      if (destinationUser) {
        destinationUser.balance = (destinationUser.balance || 0) + +amount;
        await this.userRepository.update(destination, {
          balance: destinationUser.balance
        });
      }
    }
  }

  private handleTransactionResponse(
    transaction: Transaction | null
  ): ApiResponse<Transaction> {
    if (!transaction) {
      return createResponse('NotFound', null, 'Transaction not found');
    }
    return createResponse(
      'OK',
      transaction,
      'Transaction retrieved successfully'
    );
  }

  private handleError(message: string, error: any): ApiResponse<null> {
    console.error(message, error);
    return createResponse(
      'ServerError',
      null,
      'An error occurred while processing your request'
    );
  }
}
