// update-customer-care.dto.ts
import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsObject,
  IsBoolean
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerCareDto } from './create-customer_cares.dto';
import { CustomerCareInquiry } from 'src/customer_cares_inquires/entities/customer_care_inquiry.entity';

export class UpdateCustomerCareDto extends PartialType(CreateCustomerCareDto) {
  @IsOptional()
  @IsString()
  _id: string; // Custom CustomerCare ID

  @IsOptional()
  @IsString()
  first_name: string; // CustomerCare's first name

  @IsOptional()
  @IsString()
  last_name: string; // CustomerCare's last name

  @IsOptional()
  @IsArray()
  contact_email: { title: string; is_default: boolean; email: string }[]; // Array of contact emails

  @IsOptional()
  @IsArray()
  contact_phone: { title: string; number: string; is_default: boolean }[]; // Array of contact phone numbers

  @IsOptional()
  @IsArray()
  assigned_tickets?: CustomerCareInquiry[]; // Array of assigned ticket IDs

  @IsOptional()
  @IsNumber()
  created_at: number; // Unix timestamp for creation time

  @IsOptional()
  @IsNumber()
  updated_at: number; // Unix timestamp for last update time

  @IsOptional()
  @IsNumber()
  last_login: number; // Unix timestamp for last login time

  @IsOptional()
  @IsObject()
  avatar: { key: string; url: string }; // Optional avatar with key and url

  @IsOptional()
  @IsBoolean()
  available_for_work: boolean; // Indicates if the CustomerCare is available for work

  @IsOptional()
  @IsBoolean()
  is_assigned: boolean; // Indicates if the CustomerCare is currently assigned to a ticket
}
