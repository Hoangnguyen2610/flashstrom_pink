// create-customer-care.dto.ts
import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  IsObject,
  IsNumber
} from 'class-validator';
import { CustomerCareInquiry } from 'src/customer_cares_inquires/entities/customer_care_inquiry.entity';
import { User } from 'src/users/entities/user.entity';

export class CreateCustomerCareDto {
  @IsString()
  readonly user_id: User; // Reference to the User's ID

  @IsArray()
  @IsOptional()
  readonly contact_email?: {
    title: string;
    is_default: boolean;
    email: string;
  }[]; // Array of email contacts

  @IsArray()
  @IsOptional()
  readonly contact_phone?: {
    title: string;
    number: string;
    is_default: boolean;
  }[]; // Array of phone contacts

  @IsString()
  @IsOptional()
  readonly first_name?: string; // CustomerCare's first name

  @IsString()
  @IsOptional()
  readonly last_name?: string; // CustomerCare's last name

  @IsArray()
  @IsOptional()
  readonly assigned_tickets?: CustomerCareInquiry[]; // Array of ticket IDs

  @IsNumber()
  @IsOptional()
  readonly created_at?: number; // Unix timestamp of creation

  @IsNumber()
  @IsOptional()
  readonly updated_at?: number; // Unix timestamp of last update

  @IsNumber()
  @IsOptional()
  readonly last_login?: number; // Last login timestamp

  @IsObject()
  @IsOptional()
  readonly avatar?: { key: string; url: string }; // Avatar image information

  @IsBoolean()
  @IsOptional()
  readonly available_for_work?: boolean; // Indicates if available for work

  @IsBoolean()
  @IsOptional()
  readonly is_assigned?: boolean; // Indicates if currently assigned to a ticket
}

export class createCustomerCareSignup extends CreateCustomerCareDto {
  @IsOptional()
  @IsString()
  first_name: string;

  @IsOptional()
  @IsString()
  last_name: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  phone: string;
}
