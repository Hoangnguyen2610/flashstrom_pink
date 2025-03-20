import { PartialType } from '@nestjs/mapped-types';
import {
  ContactEmail,
  ContactPhone,
  CreateRestaurantDto,
  DailyHours,
  Status
} from './create-restaurant.dto';
import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRestaurantDto extends PartialType(CreateRestaurantDto) {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  owner_id?: string;

  @IsOptional()
  @IsString()
  owner_name?: string;

  @IsOptional()
  @IsString() // Sửa từ address_id thành kiểu string
  address_id?: string;

  @IsOptional()
  @IsString()
  restaurant_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactEmail) // Thêm validate nested như CreateRestaurantDto
  contact_email?: { title: string; is_default: boolean; email: string }[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactPhone) // Thêm validate nested
  contact_phone?: { title: string; number: string; is_default: boolean }[];

  @IsOptional()
  @IsObject()
  avatar?: { url: string; key: string };

  @IsOptional()
  @IsArray()
  images_gallery?: Array<{ key: string; url: string }>;

  @IsOptional()
  @IsObject()
  @ValidateNested() // Thêm validate nested
  @Type(() => Status)
  status?: {
    is_open: boolean;
    is_active: boolean;
    is_accepted_orders: boolean;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // Validate từng phần tử là string
  promotions?: string[];

  @IsOptional()
  @IsObject()
  ratings?: {
    average_rating: number;
    review_count: number;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // Sửa specialize_in thành food_category_ids cho đồng bộ
  food_category_ids?: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested() // Thêm validate nested
  @Type(() => DailyHours)
  opening_hours?: {
    mon: { from: number; to: number };
    tue: { from: number; to: number };
    wed: { from: number; to: number };
    thu: { from: number; to: number };
    fri: { from: number; to: number };
    sat: { from: number; to: number };
    sun: { from: number; to: number };
  };
}
