import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { createResponse, ApiResponse } from 'src/utils/createResponse';
import { UserRepository } from 'src/users/users.repository';
import { FWalletsRepository } from 'src/fwallets/fwallets.repository';
import { TransactionsRepository } from './transactions.repository';
import { FWallet } from 'src/fwallets/entities/fwallet.entity';
import { DataSource, EntityManager } from 'typeorm'; // Thêm import DataSource

@Injectable()
export class TransactionService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly userRepository: UserRepository,
    private readonly fWalletsRepository: FWalletsRepository,
    private readonly dataSource: DataSource // Inject DataSource
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
    manager?: EntityManager // Nhận manager từ OrdersService nếu có
  ): Promise<ApiResponse<Transaction>> {
    try {
      const validationResult =
        await this.validateTransaction(createTransactionDto);
      if (validationResult !== true) {
        return validationResult;
      }

      const { transaction_type, amount, fwallet_id, destination } =
        createTransactionDto;
      console.log('check transaciton dto', createTransactionDto);
      if (transaction_type === 'WITHDRAW' || transaction_type === 'PURCHASE') {
        const sourceWallet = await this.fWalletsRepository.findById(
          fwallet_id,
          manager
        );
        if (!sourceWallet) {
          return createResponse('NotFound', null, 'Source wallet not found');
        }
        await this.handleSourceWalletTransaction(sourceWallet, amount, manager);
      }

      if (transaction_type === 'DEPOSIT' || transaction_type === 'PURCHASE') {
        await this.handleDestinationWalletTransaction(
          destination,
          amount,
          manager
        );
      }

      const newTransaction = await this.transactionsRepository.create(
        createTransactionDto,
        manager
      );
      console.log('Transaction prepared:', newTransaction);
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
    const { user_id, transaction_type, amount, fwallet_id } =
      createTransactionDto;

    console.log('check creat dto transactoin service', createTransactionDto);
    const userResponse = await this.userRepository.findById(user_id);
    if (!userResponse) {
      return createResponse('NotFound', null, 'User not found');
    }

    if (transaction_type === 'WITHDRAW' || transaction_type === 'PURCHASE') {
      const sourceWallet = await this.fWalletsRepository.findById(fwallet_id);
      if (!sourceWallet) {
        return createResponse('NotFound', null, 'Source wallet not found');
      }

      const currentBalance = parseFloat(sourceWallet.balance.toString());
      if (currentBalance < amount) {
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
    amount: number,
    manager: EntityManager
  ): Promise<void> {
    console.log('check sourcewallet,', sourceWallet);
    const currentBalance = parseFloat(sourceWallet.balance.toString());
    console.log('debug here ', currentBalance, '-??', amount);
    const newBalance = Number((currentBalance - amount).toFixed(2));
    sourceWallet.balance = newBalance;
    console.log('check balance before update', sourceWallet.balance);

    const updateResult = await this.fWalletsRepository.update(
      sourceWallet.id,
      { balance: sourceWallet.balance },
      manager
    );
    console.log('check update result', updateResult);

    if (updateResult.affected === 0) {
      throw new Error(`Failed to update wallet ${sourceWallet.id}`);
    }

    const updatedWallet = await this.fWalletsRepository.findById(
      sourceWallet.id,
      manager
    );
    console.log('check wallet after update', updatedWallet);
  }

  private async handleDestinationWalletTransaction(
    destination: string,
    amount: number | string, // amount có thể là string từ DTO
    manager: EntityManager
  ): Promise<void> {
    const destinationWallet = await this.fWalletsRepository.findById(
      destination,
      manager
    );
    if (destinationWallet) {
      // Ép kiểu balance thành số
      const currentBalance = Number(destinationWallet.balance);
      if (isNaN(currentBalance)) {
        throw new Error('Invalid balance value in destination wallet');
      }

      // Ép kiểu amount thành số
      const amountNumber = Number(amount);
      if (isNaN(amountNumber)) {
        throw new Error('Invalid amount value');
      }

      // Cộng hai số và làm tròn đến 2 chữ số thập phân
      const newBalance =
        Math.round((currentBalance + amountNumber) * 100) / 100;
      destinationWallet.balance = newBalance;

      const updateResult = await this.fWalletsRepository.update(
        destinationWallet.id,
        { balance: newBalance },
        manager
      );
      if (updateResult.affected === 0) {
        throw new Error(`Failed to update wallet ${destinationWallet.id}`);
      }
    } else {
      const destinationUser = await this.userRepository.findById(
        destination,
        manager
      );
      if (destinationUser) {
        // Ép kiểu balance thành số, mặc định 0 nếu không có
        const currentBalance = Number(destinationUser.balance || 0);
        if (isNaN(currentBalance)) {
          throw new Error('Invalid balance value in destination user');
        }

        // Ép kiểu amount thành số
        const amountNumber = Number(amount);
        if (isNaN(amountNumber)) {
          throw new Error('Invalid amount value');
        }

        // Cộng hai số và làm tròn đến 2 chữ số thập phân
        const newBalance =
          Math.round((currentBalance + amountNumber) * 100) / 100;
        await this.userRepository.update(
          destination,
          { balance: newBalance },
          manager
        );
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
