import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FWallet } from './entities/fwallet.entity';
import { CreateFWalletDto } from './dto/create-fwallet.dto';
import { UpdateFwalletDto } from './dto/update-fwallet.dto';

@Injectable()
export class FWalletsRepository {
  constructor(
    @InjectRepository(FWallet)
    private repository: Repository<FWallet>
  ) {}

  async create(createDto: CreateFWalletDto): Promise<FWallet> {
    const wallet = this.repository.create(createDto);
    return await this.repository.save(wallet);
  }

  async findAll(): Promise<FWallet[]> {
    return await this.repository.find();
  }

  async findById(id: string): Promise<FWallet> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<FWallet> {
    return await this.repository.findOne({ where: { user_id: userId } });
  }

  async findByCondition(condition: any): Promise<FWallet> {
    return await this.repository.findOne({ where: condition });
  }

  async update(id: string, updateDto: UpdateFwalletDto): Promise<FWallet> {
    await this.repository.update(id, {
      ...updateDto,
      updated_at: Math.floor(Date.now() / 1000)
    });
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}
