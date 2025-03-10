import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import {
  IsString,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  IsOptional
} from 'class-validator';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsOptional()
  @IsEnum([
    'PENDING',
    'RESTAURANT_ACCEPTED',
    'IN_PROGRESS',
    'DELIVERED',
    'CANCELLED'
  ])
  status?:
    | 'PENDING'
    | 'RESTAURANT_ACCEPTED'
    | 'IN_PROGRESS'
    | 'DELIVERED'
    | 'CANCELLED'; // Status of the order

  @IsOptional()
  @IsNumber()
  @Min(0)
  distance?: number; // Total amount for the order (if updated)

  @IsOptional()
  @IsNumber()
  @Min(0)
  total_amount?: number; // Total amount for the order (if updated)

  @IsNumber()
  @Min(0)
  delivery_fee?: number; // Total amount for the order

  @IsNumber()
  @Min(0)
  service_fee?: number; // Total amount for the order

  @IsOptional()
  @IsEnum(['PENDING', 'PAID', 'FAILED'])
  payment_status?: 'PENDING' | 'PAID' | 'FAILED'; // Payment status (if updated)

  @IsOptional()
  @IsEnum(['COD', 'FWallet'])
  payment_method?: 'COD' | 'FWallet'; // Payment method (if updated)

  @IsOptional()
  @IsString()
  customer_location?: string; // Customer address (if updated)

  @IsOptional()
  @IsString()
  driver_id?: string; // Driver ID (if updated)

  @IsOptional()
  @IsString()
  restaurant_location?: string; // Restaurant address (if updated)

  @IsOptional()
  @IsArray()
  order_items?: Array<{
    item_id: string; // Menu item ID
    variant_id: string; // Menu item ID
    name: string; // Name of the menu item
    quantity: number; // Quantity of the item
    price_at_time_of_order: number; // Price at the time of the order
  }>; // Array of items to update

  @IsOptional()
  @IsString()
  customer_note?: string; // Customer note (if updated)

  @IsOptional()
  @IsString()
  restaurant_note?: string; // Restaurant note (if updated)

  @IsOptional()
  @IsNumber()
  order_time?: number; // Timestamp when the order was placed (if updated)

  @IsOptional()
  @IsNumber()
  delivery_time?: number; // Timestamp when the order is expected to be delivered (if updated)

  @IsOptional()
  @IsEnum(['ORDER_PLACED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'])
  tracking_info?:
    | 'ORDER_PLACED'
    | 'PREPARING'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'; // Tracking status
}
