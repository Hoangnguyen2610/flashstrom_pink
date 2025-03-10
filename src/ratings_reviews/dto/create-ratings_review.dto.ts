import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max
} from 'class-validator';

export class CreateRatingsReviewDto {
  @IsString()
  customer_id: string;

  @IsString()
  order_id: string;

  @IsString()
  restaurant_id: string;

  @IsString()
  driver_id: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  food_rating: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  delivery_rating: number;

  @IsString()
  @IsOptional()
  food_review?: string;

  @IsString()
  @IsOptional()
  delivery_review?: string;

  @IsArray()
  @IsOptional()
  images?: Array<{ url: string; key: string }>;
}
