// customer-care.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCustomerCareDto } from './dto/create-customer_cares.dto';
import { UpdateCustomerCareDto } from './dto/update-customer_cares.dto';
import { CustomerCare, CustomerCareSchema } from './customer_cares.schema'; 
import { createResponse } from 'src/utils/createResponse';

@Injectable()
export class CustomerCareService {
  constructor(
    @InjectModel('CustomerCare')
    private readonly customerCareModel: Model<CustomerCare>,
  ) {}

  // Create a new customer care record
  async create(createCustomerCareDto: CreateCustomerCareDto): Promise<any> {
    const {
      user_id,
      first_name,
      last_name,
      contact_email,
      contact_phone,
      assigned_tickets,
      is_assigned,
      created_at,
      updated_at,
      avatar,
      last_login,
    } = createCustomerCareDto;

    try {
      // Check if the customer care record already exists by user ID
      const existingRecord = await this.customerCareModel
        .findOne({ user_id })
        .exec();
      if (existingRecord) {
        return createResponse(
          'DuplicatedRecord',
          null,
          'Customer care record with this user ID already exists',
        );
      }

      // Create new customer care record
      const newRecord = new this.customerCareModel({
        user_id,
        first_name,
        last_name,
        contact_email,
        contact_phone,
        created_at,
        updated_at,
        avatar,
        last_login,
      });

      await newRecord.save();
      return createResponse('OK', newRecord, 'Customer care record created successfully');
    } catch (error) {
      return createResponse(
        'ServerError',
        null,
        'An error occurred while creating the customer care record',
      );
    }
  }

  // Get all customer care records
  async findAll(): Promise<any> {
    try {
      const records = await this.customerCareModel.find().exec();
      return createResponse('OK', records, 'Fetched all customer care records');
    } catch (error) {
      return createResponse(
        'ServerError',
        null,
        'An error occurred while fetching customer care records',
      );
    }
  }

  // Get a customer care record by ID
  async findCustomerCareById(id: string): Promise<any> {
    try {
      const record = await this.customerCareModel.findById(id).exec();
      if (!record) {
        return createResponse('NotFound', null, 'Customer care record not found');
      }
      return createResponse('OK', record, 'Fetched customer care record successfully');
    } catch (error) {
      return createResponse(
        'ServerError',
        null,
        'An error occurred while fetching the customer care record',
      );
    }
  }

  // Get one customer care record by conditions
  async findOne(conditions: object): Promise<any> {
    const record = await this.customerCareModel.findOne(conditions).exec();
    if (!record) {
      return createResponse('NotFound', null, 'Customer care record not found');
    }
    try {
      return createResponse('OK', record, 'Fetched customer care record successfully');
    } catch (error) {
      return createResponse(
        'ServerError',
        null,
        'An error occurred while fetching the customer care record',
      );
    }
  }

  // Update a customer care record by ID
  async update(id: string, updateCustomerCareDto: UpdateCustomerCareDto): Promise<any> {
    const { contact_phone, contact_email, first_name, last_name } = updateCustomerCareDto;

    // Retrieve the current customer care data before making changes
    const updatedRecord = await this.customerCareModel.findById(id).exec();

    if (!updatedRecord) {
      return createResponse('NotFound', null, 'Customer care record not found');
    }

    // Check and update contact_phone array
    if (contact_phone && contact_phone.length > 0) {
      for (const newPhone of contact_phone) {
        const existingPhoneIndex = updatedRecord.contact_phone.findIndex(
          (phone) => phone.number === newPhone.number,
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
          (email) => email.email === newEmail.email,
        );

        if (existingEmailIndex !== -1) {
          updatedRecord.contact_email[existingEmailIndex] = newEmail;
        } else {
          updatedRecord.contact_email.push(newEmail);
        }
      }
    }

    // Update basic fields
    const finalUpdatedRecord = await this.customerCareModel
      .findByIdAndUpdate(
        id,
        {
          contact_phone: updatedRecord.contact_phone,
          contact_email: updatedRecord.contact_email,
          first_name,
          last_name,
        },
        { new: true },
      )
      .exec();

    return createResponse(
      'OK',
      finalUpdatedRecord,
      'Customer care record updated successfully',
    );
  }

  // Toggle availability (if applicable for customer care)
  async setAvailability(id: string): Promise<any> {
    try {
      const record = await this.customerCareModel.findById(id).exec();

      if (!record) {
        return createResponse('NotFound', null, 'Customer care record not found');
      }

      // Toggle the available_for_work flag (if your schema uses it)
      record.available_for_work = !record.available_for_work;

      const savedRecord = await record.save();
      return createResponse('OK', savedRecord, 'Customer care record updated successfully');
    } catch (error) {
      return createResponse(
        'ServerError',
        null,
        'An error occurred while updating the customer care record',
      );
    }
  }

  // Delete a customer care record by ID
  async remove(id: string): Promise<any> {
    try {
      const deletedRecord = await this.customerCareModel.findByIdAndDelete(id).exec();

      if (!deletedRecord) {
        return createResponse('NotFound', null, 'Customer care record not found');
      }

      return createResponse('OK', null, 'Customer care record deleted successfully');
    } catch (error) {
      return createResponse(
        'ServerError',
        null,
        'An error occurred while deleting the customer care record',
      );
    }
  }

  // Update the avatar for a customer care record
  async updateEntityAvatar(
    uploadResult: { url: string; public_id: string },
    entityId: string,
  ) {
    const record = await this.customerCareModel.findByIdAndUpdate(
      entityId,
      { avatar: { url: uploadResult.url, key: uploadResult.public_id } },
      { new: true },
    );

    if (!record) {
      return createResponse('NotFound', null, 'Customer care record not found');
    }

    return createResponse('OK', record, 'Customer care avatar updated successfully');
  }
}
