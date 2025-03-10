import { PartialType } from '@nestjs/mapped-types';
import {
  CreatePromotionDto,
  DiscountType,
  PromotionStatus
} from './create-promotion.dto';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { FoodCategory } from 'src/food_categories/entities/food_category.entity'; // Import FoodCategory

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {
  @IsOptional()
  name?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsNumber()
  start_date?: number;

  @IsOptional()
  @IsNumber()
  end_date?: number;

  @IsOptional()
  avatar?: { url: string; key: string };

  @IsOptional()
  @IsEnum(DiscountType)
  discount_type?: DiscountType;

  @IsOptional()
  @IsNumber()
  discount_value?: number;

  @IsOptional()
  @IsNumber()
  promotion_cost_price?: number;

  @IsOptional()
  @IsNumber()
  minimum_order_value?: number;

  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;

  @IsOptional()
  food_categories?: FoodCategory[]; // Đổi từ string[] sang FoodCategory[]

  @IsOptional()
  bogo_details?: {
    buy_quantity: number;
    get_quantity: number;
    max_redemptions?: number;
  };
}
