import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

// Enum for status
export enum PromotionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED'
}

// Enum for discount type
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',

  FIXED = 'FIXED',
  BOGO = 'BOGO'
}

// Add BOGO details interface
interface BogoDetails {
  buy_quantity: number;
  get_quantity: number;
  max_redemptions?: number;
}

export class CreatePromotionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNumber()
  start_date: number;

  @IsNumber()
  end_date: number;

  @IsEnum(DiscountType) // Validates the discount_type against the DiscountType enum
  discount_type: DiscountType;

  @IsNumber()
  discount_value: number;

  @IsNumber()
  promotion_cost_price: number;

  @IsOptional()
  @IsNumber()
  minimum_order_value: number;

  @IsOptional()
  avatar?: {
    url: string;
    key: string;
  }; // Avatar object with url and key, optional

  @IsOptional()
  @IsEnum(PromotionStatus) // Validates the status against the PromotionStatus enum
  status: PromotionStatus;

  @IsOptional()
  @IsString({ each: true }) // Ensures that each item in the array is a string
  food_categories: string[];

  @IsOptional()
  bogo_details?: BogoDetails;
}
