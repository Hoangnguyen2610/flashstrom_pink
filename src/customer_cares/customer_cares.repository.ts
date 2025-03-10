import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerCare } from './entities/customer_care.entity';
import { CreateCustomerCareDto } from './dto/create-customer_cares.dto';

@Injectable()
export class CustomerCaresRepository {
  constructor(
    @InjectRepository(CustomerCare)
    private repository: Repository<CustomerCare>
  ) {}

  async create(createDto: CreateCustomerCareDto): Promise<CustomerCare> {
    const customerCare = this.repository.create(createDto);
    return await this.repository.save(customerCare);
  }

  async findAll(): Promise<CustomerCare[]> {
    return await this.repository.find();
  }

  async findById(id: string): Promise<CustomerCare> {
    return await this.repository.findOne({ where: { id } });
  }

  async findOne(condition: any): Promise<CustomerCare> {
    console.log('check condition', condition);
    const bla = await this.repository.findOne({ where: condition });
    console.log('check bla', bla);
    return bla;
  }
  async findByUserId(userId: string): Promise<CustomerCare> {
    console.log('check condition', { user_id: userId });
    const bla = await this.repository
      .createQueryBuilder('customerCare')
      .where('customerCare.user_id = :userId', { userId })
      .getOne();
    console.log('check bla', bla);
    return bla;
  }

  async update(id: string, updateDto: any): Promise<CustomerCare> {
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
