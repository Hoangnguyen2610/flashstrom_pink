import {
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  IsObject,
  ValidateNested,
  IsNumber
} from 'class-validator';
import { Type } from 'class-transformer';
import { Enum_AppTheme } from 'src/types/Payload';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';

class Avatar {
  @IsString()
  url: string;

  @IsString()
  key: string;
}

class AppPreferences {
  @IsEnum(Enum_AppTheme)
  theme: Enum_AppTheme;
}

class RestaurantHistory {
  @IsString()
  restaurant_id: string;

  @IsNumber()
  count: number;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  address_ids?: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Avatar)
  avatar?: Avatar;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_category_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favorite_restaurant_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favorite_items?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  support_tickets?: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AppPreferences)
  app_preferences?: AppPreferences;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestaurantHistory)
  restaurant_history?: RestaurantHistory[];
}

export class UpdateCustomerPreferredCategoryDto extends UpdateCustomerDto {
  preferred_category: string;
}
export class UpdateCustomerFavoriteRestaurantDto extends UpdateCustomerDto {
  @IsOptional()
  @IsString()
  favorite_restaurant: string;
}
