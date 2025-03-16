import {
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  IsInt,
  IsNumber,
  IsObject,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { Enum_AppTheme } from 'src/types/Payload'; // Importing Enum_AppTheme from the schema

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

export class CreateCustomerDto {
  @IsString()
  user_id: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Avatar)
  avatar?: Avatar;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  address_ids?: string[];

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

  @IsOptional()
  @IsInt()
  created_at: number; // Unix timestamp for when the customer is created

  @IsOptional()
  @IsInt()
  updated_at: number; // Unix timestamp for when the customer was last updated
}

export class createCustomerSignup extends CreateCustomerDto {
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
