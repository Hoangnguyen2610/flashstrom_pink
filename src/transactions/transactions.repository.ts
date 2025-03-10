import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsRepository {
  constructor(
    @InjectRepository(Transaction)
    private repository: Repository<Transaction>
  ) {}

  async create(createDto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.repository.create(createDto);
    return await this.repository.save(transaction);
  }

  async findAll(): Promise<Transaction[]> {
    return await this.repository.find();
  }

  async findById(id: string): Promise<Transaction> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByCondition(condition: any): Promise<Transaction> {
    return await this.repository.findOne({ where: condition });
  }

  async update(
    id: string,
    updateDto: UpdateTransactionDto
  ): Promise<Transaction> {
    await this.repository.update(id, {
      ...updateDto,
      updated_at: Math.floor(Date.now() / 1000)
    });
    return await this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}
