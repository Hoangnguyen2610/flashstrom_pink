import {
  IsString,
  IsArray,
  IsOptional,
  IsObject,
  IsNumber,
  IsBoolean
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverDto } from './create-driver.dto';

export class UpdateDriverDto extends PartialType(CreateDriverDto) {
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
  contact_email?: { title: string; is_default: boolean; email: string }[];

  @IsOptional()
  @IsArray()
  contact_phone?: { title: string; number: string; is_default: boolean }[];

  @IsOptional()
  @IsObject()
  vehicle?: {
    license_plate: string;
    model: string;
    color: string;
  };

  @IsOptional()
  @IsObject()
  current_location?: {
    lat: number;
    lng: number;
  };

  @IsOptional()
  @IsArray()
  current_order_id?: string[];

  @IsOptional()
  @IsNumber()
  created_at: number; // Unix timestamp for creation time

  @IsOptional()
  @IsNumber()
  updated_at: number; // Unix timestamp for last update time

  @IsOptional()
  @IsNumber()
  last_login: number; // Unix timestamp for last login time

  @IsOptional()
  @IsObject()
  avatar?: { key: string; url: string };

  @IsOptional()
  @IsBoolean()
  available_for_work?: boolean;

  @IsOptional()
  @IsBoolean()
  is_on_delivery?: boolean;

  @IsOptional()
  @IsNumber()
  active_points?: number;

  @IsOptional()
  @IsObject()
  rating?: {
    average_rating: number;
    review_count: number;
  };
}
