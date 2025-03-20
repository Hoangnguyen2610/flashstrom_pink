import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity'; // Import FoodCategory
import { DiscountType, PromotionStatus } from '../entities/promotion.entity';

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

  @IsEnum(DiscountType)
  discount_type: DiscountType;

  @IsNumber()
  discount_value: number;

  @IsNumber()
  promotion_cost_price: number;

  @IsOptional()
  @IsNumber()
  minimum_order_value: number;

  @IsOptional()
  avatar?: { url: string; key: string };

  @IsOptional()
  @IsEnum(PromotionStatus)
  status: PromotionStatus;

  @IsOptional()
  food_categories?: FoodCategory[]; // Đổi từ string[] sang FoodCategory[]

  @IsOptional()
  bogo_details?: BogoDetails;
}
