import { PartialType } from '@nestjs/mapped-types';
import {
  CreatePromotionDto,
  DiscountType,
  PromotionStatus,
} from './create-promotion.dto';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  start_date: number;

  @IsOptional()
  @IsNumber()
  end_date: number;

  @IsOptional()
  @IsEnum(DiscountType) // Validates the discount_type against the DiscountType enum
  discount_type: DiscountType;

  @IsOptional()
  @IsNumber()
  discount_value: number;

  @IsOptional()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  minimum_order_value: number;

  @IsOptional()
  @IsEnum(PromotionStatus) // Validates the status against the PromotionStatus enum
  status: PromotionStatus;

  @IsOptional()
  @IsString({ each: true }) // Ensures that each item in the array is a string
  food_categories: string[];
}
