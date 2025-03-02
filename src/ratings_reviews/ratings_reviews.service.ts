import { Injectable } from '@nestjs/common';
import { CreateRatingsReviewDto } from './dto/create-ratings_review.dto';
import { UpdateRatingsReviewDto } from './dto/update-ratings_review.dto';

@Injectable()
export class RatingsReviewsService {
  create(createRatingsReviewDto: CreateRatingsReviewDto) {
    return 'This action adds a new ratingsReview';
  }

  findAll() {
    return `This action returns all ratingsReviews`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ratingsReview`;
  }

  update(id: number, updateRatingsReviewDto: UpdateRatingsReviewDto) {
    return `This action updates a #${id} ratingsReview`;
  }

  remove(id: number) {
    return `This action removes a #${id} ratingsReview`;
  }
}
