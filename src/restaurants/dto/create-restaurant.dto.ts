import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsBoolean,
  IsEmail,
  IsNumber,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

class ContactEmail {
  @IsString()
  title: string;

  @IsBoolean()
  is_default: boolean;

  @IsEmail()
  email: string;
}

class ContactPhone {
  @IsString()
  title: string;

  @IsString()
  number: string;

  @IsBoolean()
  is_default: boolean;
}

class Status {
  @IsBoolean()
  is_open: boolean;

  @IsBoolean()
  is_active: boolean;

  @IsBoolean()
  is_accepted_orders: boolean;
}

class OpeningHours {
  @IsNumber()
  from: number;

  @IsNumber()
  to: number;
}

class DailyHours {
  @ValidateNested()
  @Type(() => OpeningHours)
  mon: OpeningHours;

  @ValidateNested()
  @Type(() => OpeningHours)
  tue: OpeningHours;

  @ValidateNested()
  @Type(() => OpeningHours)
  wed: OpeningHours;

  @ValidateNested()
  @Type(() => OpeningHours)
  thu: OpeningHours;

  @ValidateNested()
  @Type(() => OpeningHours)
  fri: OpeningHours;

  @ValidateNested()
  @Type(() => OpeningHours)
  sat: OpeningHours;

  @ValidateNested()
  @Type(() => OpeningHours)
  sun: OpeningHours;
}

export class CreateRestaurantDto {
  @IsString()
  owner_id: string;

  @IsString()
  owner_name: string;

  @IsString()
  address_id: string;

  @IsString()
  restaurant_name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactEmail)
  contact_email: ContactEmail[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactPhone)
  contact_phone: ContactPhone[];

  @IsOptional()
  @IsObject()
  avatar?: { url: string; key: string };

  @IsOptional()
  @IsArray()
  images_gallery?: string[];

  @IsObject()
  @ValidateNested()
  @Type(() => Status)
  status: Status;

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
  food_category_ids?: string[];

  @IsObject()
  @ValidateNested()
  @Type(() => DailyHours)
  opening_hours: DailyHours;
}
