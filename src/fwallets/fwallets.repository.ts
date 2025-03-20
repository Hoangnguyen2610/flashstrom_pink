import { Injectable } from '@nestjs/common';
import { Repository, EntityManager, UpdateResult, Like } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FWallet } from './entities/fwallet.entity';
import { CreateFWalletDto } from './dto/create-fwallet.dto';
import { UpdateFwalletDto } from './dto/update-fwallet.dto';
import { Transaction } from 'src/transactions/entities/transaction.entity';

@Injectable()
export class FWalletsRepository {
  constructor(
    @InjectRepository(FWallet)
    private repository: Repository<FWallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>
  ) {}

  async create(
    createDto: CreateFWalletDto,
    manager?: EntityManager
  ): Promise<FWallet> {
    const repo = manager ? manager.getRepository(FWallet) : this.repository;
    const wallet = repo.create(createDto);
    return await repo.save(wallet);
  }

  async findAll(manager?: EntityManager): Promise<FWallet[]> {
    const repo = manager ? manager.getRepository(FWallet) : this.repository;
    return await repo.find({ relations: ['user'] });
  }

  async findBySearchQuery(
    query: string,
    manager?: EntityManager
  ): Promise<FWallet[]> {
    const repo = manager ? manager.getRepository(FWallet) : this.repository;
    return await repo.find({
      where: [
        { first_name: Like(`%${query}%`) },
        { last_name: Like(`%${query}%`) }
      ],
      relations: ['user']
    });
  }

  async findById(id: string, manager?: EntityManager): Promise<FWallet> {
    const repo = manager ? manager.getRepository(FWallet) : this.repository;
    return await repo.findOne({ where: { id } });
  }

  async findByUserId(
    userId: string,
    manager?: EntityManager
  ): Promise<FWallet> {
    const repo = manager ? manager.getRepository(FWallet) : this.repository;
    return await repo.findOne({ where: { user_id: userId } });
  }

  async findByCondition(
    condition: any,
    manager?: EntityManager
  ): Promise<FWallet> {
    const repo = manager ? manager.getRepository(FWallet) : this.repository;
    return await repo.findOne({ where: condition });
  }

  async update(
    id: string,
    updateDto: UpdateFwalletDto,
    manager?: EntityManager
  ): Promise<UpdateResult> {
    const repo = manager ? manager.getRepository(FWallet) : this.repository;
    const result = await repo.update(id, {
      ...updateDto,
      updated_at: Math.floor(Date.now() / 1000)
    });
    console.log('repository update result', result);
    return result;
  }

  async delete(id: string, manager?: EntityManager): Promise<boolean> {
    const repo = manager ? manager.getRepository(FWallet) : this.repository;
    const result = await repo.delete(id);
    return result.affected > 0;
  }

  async findHistoryTransaction(
    fWalletId: string,
    manager?: EntityManager
  ): Promise<Transaction[]> {
    const repo = manager
      ? manager.getRepository(Transaction)
      : this.transactionRepository;
    return await repo.find({
      where: [
        { fwallet_id: fWalletId }, // Giao dịch mà FWallet là nguồn
        { destination: fWalletId } // Giao dịch mà FWallet là đích
      ],
      order: { created_at: 'DESC' } // Sắp xếp theo thời gian giảm dần
    });
  }
}
