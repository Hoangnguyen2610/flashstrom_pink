import { IsString, IsArray, IsObject, IsOptional } from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  owner_id: string;

  @IsString()
  owner_name: string;

  @IsString()
  address: string;

  @IsString()
  restaurant_name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  promotions: string[];

  @IsArray()
  contact_email: { title: string; is_default: boolean; email: string }[];

  @IsArray()
  contact_phone: { title: string; number: string; is_default: boolean }[];

  @IsOptional()
  @IsObject()
  avatar: { url: string; key: string };

  @IsOptional()
  @IsArray()
  images_gallery: string[];

  @IsOptional()
  @IsObject()
  status: { is_open: boolean; is_active: boolean; is_accepted_orders: boolean };

  @IsOptional()
  @IsArray()
  specialize_in: string[];

  @IsOptional()
  @IsObject()
  opening_hours: {
    mon: { from: number; to: number };
    tue: { from: number; to: number };
    wed: { from: number; to: number };
    thu: { from: number; to: number };
    fri: { from: number; to: number };
    sat: { from: number; to: number };
    sun: { from: number; to: number };
  };
}
