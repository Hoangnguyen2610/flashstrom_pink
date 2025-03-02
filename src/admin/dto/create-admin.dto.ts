import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { AdminRole, AdminPermission, AdminStatus } from 'src/utils/types/admin';

export class CreateAdminDto {
  @IsString()
  user_id: string;

  @IsEnum(AdminRole)
  role: AdminRole;

  @IsArray()
  @IsEnum(AdminPermission, { each: true })
  permissions: AdminPermission[];

  @IsOptional()
  @IsArray()
  assigned_restaurants?: string[];

  @IsOptional()
  @IsArray()
  assigned_drivers?: string[];

  @IsOptional()
  @IsArray()
  assigned_customer_care?: string[];

  @IsOptional()
  @IsNumber()
  created_at?: number;

  @IsOptional()
  @IsNumber()
  updated_at: number;

  @IsOptional()
  @IsString()
  created_by?: string;

  @IsEnum(AdminStatus)
  status: AdminStatus;
}
