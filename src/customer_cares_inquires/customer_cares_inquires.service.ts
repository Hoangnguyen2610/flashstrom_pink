import { Injectable } from '@nestjs/common';
import { CustomerCareInquiriesRepository } from './customer_cares_inquires.repository';
import { CreateCustomerCareInquiryDto } from './dto/create-customer-care-inquiry.dto';
import { UpdateCustomerCareInquiryDto } from './dto/update-customer-care-inquiry.dto';
import { createResponse } from 'src/utils/createResponse';

@Injectable()
export class CustomerCareInquiriesService {
  constructor(private readonly repository: CustomerCareInquiriesRepository) {}

  async create(createDto: CreateCustomerCareInquiryDto) {
    try {
      const inquiry = await this.repository.create(createDto);
      return createResponse('OK', inquiry, 'Inquiry created successfully');
    } catch (error) {
      console.error('Error creating inquiry:', error);
      return createResponse('ServerError', null, 'Failed to create inquiry');
    }
  }

  async findAll() {
    try {
      const inquiries = await this.repository.findAll();
      return createResponse('OK', inquiries, 'Inquiries fetched successfully');
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      return createResponse('ServerError', null, 'Failed to fetch inquiries');
    }
  }

  async findById(id: string) {
    try {
      const inquiry = await this.repository.findById(id);
      if (!inquiry) {
        return createResponse('NotFound', null, 'Inquiry not found');
      }
      return createResponse('OK', inquiry, 'Inquiry fetched successfully');
    } catch (error) {
      console.error('Error fetching inquiry:', error);
      return createResponse('ServerError', null, 'Failed to fetch inquiry');
    }
  }

  async update(id: string, updateDto: UpdateCustomerCareInquiryDto) {
    try {
      const inquiry = await this.repository.findById(id);
      if (!inquiry) {
        return createResponse('NotFound', null, 'Inquiry not found');
      }

      const updated = await this.repository.update(id, updateDto);
      return createResponse('OK', updated, 'Inquiry updated successfully');
    } catch (error) {
      console.error('Error updating inquiry:', error);
      return createResponse('ServerError', null, 'Failed to update inquiry');
    }
  }

  async remove(id: string) {
    try {
      const deleted = await this.repository.remove(id);
      if (!deleted) {
        return createResponse('NotFound', null, 'Inquiry not found');
      }
      return createResponse('OK', null, 'Inquiry deleted successfully');
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      return createResponse('ServerError', null, 'Failed to delete inquiry');
    }
  }
}
