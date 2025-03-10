import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingsReviewsService } from './ratings_reviews.service';
import { RatingsReviewsController } from './ratings_reviews.controller';
import { RatingsReview } from './entities/ratings_review.entity';
import { RatingsReviewsRepository } from './ratings_reviews.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RatingsReview])],
  controllers: [RatingsReviewsController],
  providers: [RatingsReviewsService, RatingsReviewsRepository],
  exports: [RatingsReviewsService, RatingsReviewsRepository]
})
export class RatingsReviewsModule {}
