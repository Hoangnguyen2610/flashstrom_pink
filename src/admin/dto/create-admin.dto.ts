import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsNumber
} from 'class-validator';
import { AdminRole, AdminPermission, AdminStatus } from 'src/utils/types/admin';

export class CreateAdminDto {
  @IsString()
  user_id: string;

  @IsEnum(AdminRole)
  role: AdminRole;

  @IsArray()
  permissions: AdminPermission[];

  @IsArray()
  @IsOptional()
  assigned_restaurants?: string[];

  @IsArray()
  @IsOptional()
  assigned_drivers?: string[];

  @IsArray()
  @IsOptional()
  assigned_customer_care?: string[];

  @IsOptional()
  @IsNumber()
  created_at?: number;

  @IsOptional()
  @IsNumber()
  updated_at: number;

  @IsString()
  @IsOptional()
  created_by?: string;

  @IsEnum(AdminStatus)
  status: AdminStatus;
}
