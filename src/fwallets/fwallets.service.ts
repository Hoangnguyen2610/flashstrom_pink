import { Injectable } from '@nestjs/common';
import { CreateFWalletDto } from './dto/create-fwallet.dto';
import { UpdateFwalletDto } from './dto/update-fwallet.dto';
import { FWalletsRepository } from './fwallets.repository';
import { createResponse } from 'src/utils/createResponse';
import { ApiResponse } from 'src/utils/createResponse';
import { FWallet } from './entities/fwallet.entity';

@Injectable()
export class FWalletService {
  constructor(private readonly fWalletsRepository: FWalletsRepository) {}

  async create(
    createFWalletDto: CreateFWalletDto
  ): Promise<ApiResponse<FWallet>> {
    try {
      const existingWallet = await this.fWalletsRepository.findByUserId(
        createFWalletDto.user_id
      );

      if (existingWallet) {
        return createResponse(
          'DuplicatedRecord',
          null,
          'Wallet for this user already exists'
        );
      }

      const newWallet = await this.fWalletsRepository.create(createFWalletDto);
      return createResponse('OK', newWallet, 'Wallet created successfully');
    } catch (error) {
      console.error('Error creating wallet:', error);
      return createResponse('ServerError', null, 'Error creating wallet');
    }
  }

  async findAll(): Promise<ApiResponse<FWallet[]>> {
    try {
      const wallets = await this.fWalletsRepository.findAll();
      return createResponse('OK', wallets, 'Fetched all wallets');
    } catch (error) {
      console.error('Error fetching wallets:', error);
      return createResponse('ServerError', null, 'Error fetching wallets');
    }
  }

  async findFWalletById(id: string): Promise<ApiResponse<FWallet>> {
    try {
      const wallet = await this.fWalletsRepository.findById(id);
      if (!wallet) {
        return createResponse('NotFound', null, 'Wallet not found');
      }
      return createResponse('OK', wallet, 'Wallet retrieved successfully');
    } catch (error) {
      console.error('Error fetching wallet:', error);
      return createResponse('ServerError', null, 'Error fetching wallet');
    }
  }

  async findOne(conditions: object): Promise<ApiResponse<FWallet>> {
    try {
      const wallet = await this.fWalletsRepository.findByCondition(conditions);
      if (!wallet) {
        return createResponse('NotFound', null, 'Wallet not found');
      }
      return createResponse('OK', wallet, 'Wallet retrieved successfully');
    } catch (error) {
      console.error('Error fetching wallet:', error);
      return createResponse('ServerError', null, 'Error fetching wallet');
    }
  }

  async update(
    id: string,
    updateFWalletDto: UpdateFwalletDto
  ): Promise<ApiResponse<FWallet>> {
    try {
      const wallet = await this.fWalletsRepository.findById(id);
      if (!wallet) {
        return createResponse('NotFound', null, 'Wallet not found');
      }

      const updatedWallet = await this.fWalletsRepository.update(
        id,
        updateFWalletDto
      );
      return createResponse('OK', updatedWallet, 'Wallet updated successfully');
    } catch (error) {
      console.error('Error updating wallet:', error);
      return createResponse('ServerError', null, 'Error updating wallet');
    }
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      const result = await this.fWalletsRepository.delete(id);
      if (!result) {
        return createResponse('NotFound', null, 'Wallet not found');
      }
      return createResponse('OK', null, 'Wallet deleted successfully');
    } catch (error) {
      console.error('Error deleting wallet:', error);
      return createResponse('ServerError', null, 'Error deleting wallet');
    }
  }
}
