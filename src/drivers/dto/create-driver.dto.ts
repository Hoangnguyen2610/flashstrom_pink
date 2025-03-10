import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  IsObject,
  IsNumber
} from 'class-validator';

export class CreateDriverDto {
  @IsString()
  user_id: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsArray()
  contact_email: {
    title: string;
    is_default: boolean;
    email: string;
  }[];

  @IsArray()
  contact_phone: {
    title: string;
    number: string;
    is_default: boolean;
  }[];

  @IsObject()
  vehicle: {
    license_plate: string;
    model: string;
    color: string;
  };

  @IsObject()
  current_location: {
    lat: number;
    lng: number;
  };

  @IsArray()
  current_order_id: string[];

  @IsBoolean()
  available_for_work: boolean;

  @IsBoolean()
  is_on_delivery: boolean;

  @IsNumber()
  active_points: number;

  @IsObject()
  rating: {
    average_rating: number;
    review_count: number;
  };

  @IsObject()
  @IsOptional()
  avatar?: {
    key: string;
    url: string;
  };
}
