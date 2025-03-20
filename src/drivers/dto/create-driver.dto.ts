import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  IsObject,
  IsNumber
} from 'class-validator';
import { Order } from 'src/orders/entities/order.entity'; // Thêm import

export class CreateDriverDto {
  @IsString()
  user_id: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsArray()
  contact_email: { title: string; is_default: boolean; email: string }[];

  @IsArray()
  contact_phone: { title: string; number: string; is_default: boolean }[];

  @IsObject()
  vehicle: { license_plate: string; model: string; color: string };

  @IsObject()
  current_location: { lat: number; lng: number };

  @IsArray()
  @IsOptional() // Để optional nếu driver mới không cần orders ngay
  current_orders?: Order[]; // Đổi từ current_order_id thành current_orders

  @IsBoolean()
  available_for_work: boolean;

  @IsBoolean()
  is_on_delivery: boolean;

  @IsNumber()
  active_points: number;

  @IsObject()
  rating: { average_rating: number; review_count: number };

  @IsObject()
  @IsOptional()
  avatar?: { key: string; url: string };
}

export class createDriverSignup extends CreateDriverDto {
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

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  license_plate?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  owner?: string;
}
