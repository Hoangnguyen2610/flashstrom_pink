import { PartialType } from '@nestjs/mapped-types';
import { CreateRatingsReviewDto } from './create-ratings_review.dto';

export class UpdateRatingsReviewDto extends PartialType(CreateRatingsReviewDto) {}
