import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
  IsEnum
} from 'class-validator';

export class CreateRatingsReviewDto {
  // Reviewer (có thể là driver, customer, hoặc restaurant)
  @IsString()
  @IsOptional()
  rr_reviewer_driver_id?: string;

  @IsString()
  @IsOptional()
  rr_reviewer_customer_id?: string;

  @IsString()
  @IsOptional()
  rr_reviewer_restaurant_id?: string;

  @IsEnum(['driver', 'customer', 'customerCare', 'restaurant'])
  reviewer_type: string;

  // Recipient (có thể là driver, customer, hoặc restaurant)
  @IsString()
  @IsOptional()
  rr_recipient_driver_id?: string;

  @IsString()
  @IsOptional()
  rr_recipient_customer_id?: string;

  @IsString()
  @IsOptional()
  rr_recipient_restaurant_id?: string;

  @IsEnum(['driver', 'customer', 'customerCare', 'restaurant'])
  recipient_type: string;

  // Order
  @IsString()
  order_id: string;

  // Ratings and reviews
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
