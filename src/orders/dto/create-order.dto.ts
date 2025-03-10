import {
  IsString,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  IsOptional
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  customer_id: string; // Customer ID

  @IsString()
  restaurant_id: string; // Restaurant ID

  @IsOptional()
  @IsNumber()
  @Min(0)
  distance?: number; // Total amount for the order (if updated)

  @IsEnum([
    'PENDING',
    'RESTAURANT_ACCEPTED',
    'IN_PROGRESS',
    'DELIVERED',
    'CANCELLED'
  ])
  status:
    | 'PENDING'
    | 'RESTAURANT_ACCEPTED'
    | 'IN_PROGRESS'
    | 'DELIVERED'
    | 'CANCELLED'; // Status of the order

  @IsNumber()
  @Min(0)
  total_amount: number; // Total amount for the order

  @IsNumber()
  @Min(0)
  delivery_fee: number; // Total amount for the order

  @IsNumber()
  @Min(0)
  service_fee: number; // Total amount for the order

  @IsEnum(['PENDING', 'PAID', 'FAILED'])
  payment_status: 'PENDING' | 'PAID' | 'FAILED'; // Payment status

  @IsEnum(['COD', 'FWallet'])
  payment_method: 'COD' | 'FWallet'; // Payment method used for the order

  @IsString()
  customer_location: string; // Reference to customer's address

  @IsString()
  restaurant_location: string; // Reference to restaurant's address

  @IsArray()
  @IsOptional()
  order_items: Array<{
    item_id: string; // Menu item ID
    variant_id: string; // Menu item ID
    name: string; // Name of the menu item
    quantity: number; // Quantity of the item
    price_at_time_of_order: number; // Price at the time of the order
  }>; // Array of ordered items

  @IsString()
  @IsOptional()
  customer_note?: string; // Optional note from the customer

  @IsString()
  @IsOptional()
  restaurant_note?: string; // Optional note from the restaurant

  @IsNumber()
  order_time: number; // Unix timestamp when the order is placed

  @IsNumber()
  delivery_time: number; // Unix timestamp when the order is expected to be delivered

  @IsEnum(['ORDER_PLACED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'])
  tracking_info:
    | 'ORDER_PLACED'
    | 'PREPARING'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'; // Order tracking status
}
