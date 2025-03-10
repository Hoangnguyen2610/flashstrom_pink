import { PartialType } from '@nestjs/mapped-types';
import { CreateRestaurantDto } from './create-restaurant.dto';
import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

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
  address_id?: string;

  @IsOptional()
  @IsString()
  restaurant_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  contact_email?: { title: string; is_default: boolean; email: string }[];

  @IsOptional()
  @IsArray()
  contact_phone?: { title: string; number: string; is_default: boolean }[];

  @IsOptional()
  @IsObject()
  avatar?: { url: string; key: string };

  @IsOptional()
  @IsArray()
  images_gallery?: string[];

  @IsOptional()
  @IsObject()
  status?: {
    is_open: boolean;
    is_active: boolean;
    is_accepted_orders: boolean;
  };

  @IsOptional()
  @IsArray()
  promotions?: string[];

  @IsOptional()
  @IsObject()
  ratings?: {
    average_rating: number;
    review_count: number;
  };

  @IsOptional()
  @IsArray()
  specialize_in?: string[];

  @IsOptional()
  @IsObject()
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
