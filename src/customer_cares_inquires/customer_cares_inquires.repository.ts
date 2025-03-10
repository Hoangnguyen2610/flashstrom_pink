import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerCareInquiry } from './entities/customer_care_inquiry.entity';
import { CreateCustomerCareInquiryDto } from './dto/create-customer-care-inquiry.dto';
import { UpdateCustomerCareInquiryDto } from './dto/update-customer-care-inquiry.dto';

@Injectable()
export class CustomerCareInquiriesRepository {
  constructor(
    @InjectRepository(CustomerCareInquiry)
    private repository: Repository<CustomerCareInquiry>
  ) {}

  async create(
    createDto: CreateCustomerCareInquiryDto
  ): Promise<CustomerCareInquiry> {
    try {
      // Create the basic inquiry
      const inquiry = this.repository.create(createDto);

      // Save without loading relations first
      const savedInquiry = await this.repository.save(inquiry);

      // Load the complete inquiry with appropriate relations
      return await this.repository.findOne({
        where: { id: savedInquiry.id },
        relations: [
          'customer',
          createDto.assignee_type === 'ADMIN'
            ? 'assigned_admin'
            : 'assigned_customer_care'
        ]
      });
    } catch (error) {
      console.error('Repository create error:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<CustomerCareInquiry> {
    const inquiry = await this.repository.findOne({
      where: { id }
    });

    if (!inquiry) {
      return null;
    }

    return await this.repository.findOne({
      where: { id },
      relations: [
        'customer',
        inquiry.assignee_type === 'ADMIN'
          ? 'assigned_admin'
          : 'assigned_customer_care'
      ]
    });
  }

  async findAll(): Promise<CustomerCareInquiry[]> {
    return await this.repository.find({
      relations: ['customer', 'assigned_admin', 'assigned_customer_care']
    });
  }

  async update(
    id: string,
    updateDto: UpdateCustomerCareInquiryDto
  ): Promise<CustomerCareInquiry> {
    await this.repository.update(id, {
      ...updateDto,
      updated_at: Math.floor(Date.now() / 1000)
    });

    return this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}
