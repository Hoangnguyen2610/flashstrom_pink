import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminDto } from './create-admin.dto';
import { IsEnum, IsArray, IsOptional } from 'class-validator';
import { AdminRole, AdminPermission, AdminStatus } from 'src/utils/types/admin';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Driver } from 'src/drivers/entities/driver.entity';
import { CustomerCare } from 'src/customer_cares/entities/customer_care.entity';

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
  assigned_restaurants?: Restaurant[];

  @IsOptional()
  @IsArray()
  assigned_drivers?: Driver[];

  @IsOptional()
  @IsArray()
  assigned_customer_care?: CustomerCare[];

  @IsEnum(AdminStatus)
  @IsOptional()
  status?: AdminStatus;
}
