import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateCustomerCareInquiryDto {
  @IsString()
  customer_id: string;

  @IsString()
  subject: string;

  @IsString()
  description: string;

  @IsEnum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

  @IsString()
  @IsOptional()
  order_id?: string;

  @IsString()
  @IsOptional()
  assigned_to?: string;

  @IsEnum(['ADMIN', 'CUSTOMER_CARE'])
  @IsOptional()
  assignee_type?: 'ADMIN' | 'CUSTOMER_CARE' = 'CUSTOMER_CARE';

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @IsString()
  @IsOptional()
  resolution_notes?: string;
}
