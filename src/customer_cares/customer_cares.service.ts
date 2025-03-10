// customer-care.service.ts
import { Injectable } from '@nestjs/common';
import { CreateCustomerCareDto } from './dto/create-customer_cares.dto';
import { UpdateCustomerCareDto } from './dto/update-customer_cares.dto';
import { createResponse } from 'src/utils/createResponse';
import { CustomerCaresRepository } from './customer_cares.repository';

@Injectable()
export class CustomerCareService {
  constructor(private readonly repository: CustomerCaresRepository) {}

  // Create a new customer care record
  async create(createCustomerCareDto: CreateCustomerCareDto): Promise<any> {
    const {
      user_id,
      first_name,
      last_name,
      contact_email,
      contact_phone,
      // assigned_tickets,
      // is_assigned,
      created_at,
      updated_at,
      avatar,
      last_login
    } = createCustomerCareDto;

    try {
      // Check if the customer care record already exists by user ID
      const existingRecord = await this.repository.findOne({ user_id });
      if (existingRecord) {
        return createResponse(
          'DuplicatedRecord',
          null,
          'Customer care record with this user ID already exists'
        );
      }

      // Create new customer care record
      const newRecord = await this.repository.create({
        user_id,
        first_name,
        last_name,
        contact_email,
        contact_phone,
        created_at,
        updated_at,
        avatar,
        last_login
      });

      await this.repository.create(newRecord);
      return createResponse(
        'OK',
        newRecord,
        'Customer care record created successfully'
      );
    } catch (error) {
      console.log('error', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while creating the customer care record'
      );
    }
  }

  // Get all customer care records
  async findAll(): Promise<any> {
    try {
      const records = await this.repository.findAll();
      return createResponse('OK', records, 'Fetched all customer care records');
    } catch (error) {
      console.log('error', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while fetching customer care records'
      );
    }
  }

  // Get a customer care record by ID
  async findCustomerCareById(id: string): Promise<any> {
    try {
      const record = await this.repository.findById(id);
      if (!record) {
        return createResponse(
          'NotFound',
          null,
          'Customer care record not found'
        );
      }
      return createResponse(
        'OK',
        record,
        'Fetched customer care record successfully'
      );
    } catch (error) {
      console.log('error', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while fetching the customer care record'
      );
    }
  }

  // Get one customer care record by conditions
  async findOne(conditions: object): Promise<any> {
    const record = await this.repository.findOne(conditions);
    if (!record) {
      return createResponse('NotFound', null, 'Customer care record not found');
    }
    try {
      return createResponse(
        'OK',
        record,
        'Fetched customer care record successfully'
      );
    } catch (error) {
      console.log('error', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while fetching the customer care record'
      );
    }
  }

  // Update a customer care record by ID
  async update(
    id: string,
    updateCustomerCareDto: UpdateCustomerCareDto
  ): Promise<any> {
    const { contact_phone, contact_email, first_name, last_name } =
      updateCustomerCareDto;

    // Retrieve the current customer care data before making changes
    const updatedRecord = await this.repository.findById(id);

    if (!updatedRecord) {
      return createResponse('NotFound', null, 'Customer care record not found');
    }

    // Check and update contact_phone array
    if (contact_phone && contact_phone.length > 0) {
      for (const newPhone of contact_phone) {
        const existingPhoneIndex = updatedRecord.contact_phone.findIndex(
          phone => phone.number === newPhone.number
        );

        if (existingPhoneIndex !== -1) {
          updatedRecord.contact_phone[existingPhoneIndex] = newPhone;
        } else {
          updatedRecord.contact_phone.push(newPhone);
        }
      }
    }

    // Check and update contact_email array
    if (contact_email && contact_email.length > 0) {
      for (const newEmail of contact_email) {
        const existingEmailIndex = updatedRecord.contact_email.findIndex(
          email => email.email === newEmail.email
        );

        if (existingEmailIndex !== -1) {
          updatedRecord.contact_email[existingEmailIndex] = newEmail;
        } else {
          updatedRecord.contact_email.push(newEmail);
        }
      }
    }

    // Update basic fields
    const finalUpdatedRecord = await this.repository.update(id, {
      contact_phone: updatedRecord.contact_phone,
      contact_email: updatedRecord.contact_email,
      first_name,
      last_name
    });

    return createResponse(
      'OK',
      finalUpdatedRecord,
      'Customer care record updated successfully'
    );
  }

  // Toggle availability (if applicable for customer care)
  async setAvailability(id: string): Promise<any> {
    try {
      const record = await this.repository.findById(id);

      if (!record) {
        return createResponse(
          'NotFound',
          null,
          'Customer care record not found'
        );
      }

      // Toggle the available_for_work flag (if your schema uses it)
      record.available_for_work = !record.available_for_work;

      const savedRecord = await this.repository.update(id, record);
      return createResponse(
        'OK',
        savedRecord,
        'Customer care record updated successfully'
      );
    } catch (error) {
      console.log('error', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while updating the customer care record'
      );
    }
  }

  // Delete a customer care record by ID
  async remove(id: string): Promise<any> {
    try {
      const deletedRecord = await this.repository.remove(id);

      if (!deletedRecord) {
        return createResponse(
          'NotFound',
          null,
          'Customer care record not found'
        );
      }

      return createResponse(
        'OK',
        null,
        'Customer care record deleted successfully'
      );
    } catch (error) {
      console.log('error', error);

      return createResponse(
        'ServerError',
        null,
        'An error occurred while deleting the customer care record'
      );
    }
  }

  // Update the avatar for a customer care record
  async updateEntityAvatar(
    uploadResult: { url: string; public_id: string },
    entityId: string
  ) {
    const record = await this.repository.update(entityId, {
      avatar: { url: uploadResult.url, key: uploadResult.public_id }
    });

    if (!record) {
      return createResponse('NotFound', null, 'Customer care record not found');
    }

    return createResponse(
      'OK',
      record,
      'Customer care avatar updated successfully'
    );
  }
}
