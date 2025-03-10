import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminDto } from './create-admin.dto';
import { IsEnum, IsArray, IsOptional } from 'class-validator';
import { AdminRole, AdminPermission, AdminStatus } from 'src/utils/types/admin';

export class UpdateAdminDto extends PartialType(CreateAdminDto) {
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @IsOptional()
  @IsArray()
  @IsEnum(AdminPermission, { each: true })
  permissions?: AdminPermission[];

  @IsOptional()
  @IsArray()
  assigned_restaurants?: string[];

  @IsOptional()
  @IsArray()
  assigned_drivers?: string[];

  @IsOptional()
  @IsArray()
  assigned_customer_care?: string[];

  @IsEnum(AdminStatus)
  @IsOptional()
  status?: AdminStatus;
}
