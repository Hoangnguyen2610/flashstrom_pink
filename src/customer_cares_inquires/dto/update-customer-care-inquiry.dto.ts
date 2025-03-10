import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerCareInquiryDto } from './create-customer-care-inquiry.dto';
import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';

export class UpdateCustomerCareInquiryDto extends PartialType(
  CreateCustomerCareInquiryDto
) {
  @IsOptional()
  @IsString()
  subject?: string; // Updated subject of the inquiry

  @IsOptional()
  @IsString()
  description?: string; // Updated description of the inquiry

  @IsOptional()
  @IsEnum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'; // Updated status

  @IsOptional()
  @IsString()
  assigned_to?: string; // Updated assigned agent ID

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'; // Updated priority level

  @IsOptional()
  @IsNumber()
  resolved_at?: number; // Updated resolution timestamp

  @IsOptional()
  @IsString()
  resolution_notes?: string; // Updated resolution notes

  @IsOptional()
  @IsEnum(['ADMIN', 'CUSTOMER_CARE'])
  assignee_type?: 'ADMIN' | 'CUSTOMER_CARE';
}
