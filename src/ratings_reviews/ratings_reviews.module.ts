import { Module } from '@nestjs/common';
import { RatingsReviewsService } from './ratings_reviews.service';
import { RatingsReviewsController } from './ratings_reviews.controller';

@Module({
  controllers: [RatingsReviewsController],
  providers: [RatingsReviewsService],
})
export class RatingsReviewsModule {}
