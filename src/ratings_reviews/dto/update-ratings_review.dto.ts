import { PartialType } from '@nestjs/mapped-types';
import { CreateRatingsReviewDto } from './create-ratings_review.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateRatingsReviewDto extends PartialType(
  CreateRatingsReviewDto
) {
  @IsNumber()
  @IsOptional()
  updated_at?: number;
}
