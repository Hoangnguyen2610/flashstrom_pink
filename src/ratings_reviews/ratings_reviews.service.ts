import { Injectable } from '@nestjs/common';
import { CreateRatingsReviewDto } from './dto/create-ratings_review.dto';
import { UpdateRatingsReviewDto } from './dto/update-ratings_review.dto';
import { RatingsReviewsRepository } from './ratings_reviews.repository';
import { createResponse } from 'src/utils/createResponse';

@Injectable()
export class RatingsReviewsService {
  constructor(
    private readonly ratingsReviewsRepository: RatingsReviewsRepository
  ) {}

  async create(createRatingsReviewDto: CreateRatingsReviewDto) {
    try {
      const newReview = await this.ratingsReviewsRepository.create(
        createRatingsReviewDto
      );
      return createResponse('OK', newReview, 'Review created successfully');
    } catch (error) {
      console.error('Error creating review:', error);
      return createResponse('ServerError', null, 'Failed to create review');
    }
  }

  async findAll() {
    try {
      const reviews = await this.ratingsReviewsRepository.findAll();
      return createResponse('OK', reviews, 'Reviews fetched successfully');
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return createResponse('ServerError', null, 'Failed to fetch reviews');
    }
  }

  async findOne(id: string) {
    try {
      const review = await this.ratingsReviewsRepository.findById(id);
      if (!review) {
        return createResponse('NotFound', null, 'Review not found');
      }
      return createResponse('OK', review, 'Review fetched successfully');
    } catch (error) {
      console.error('Error fetching review:', error);
      return createResponse('ServerError', null, 'Failed to fetch review');
    }
  }

  async update(id: string, updateRatingsReviewDto: UpdateRatingsReviewDto) {
    try {
      const updatedReview = await this.ratingsReviewsRepository.update(
        id,
        updateRatingsReviewDto
      );
      if (!updatedReview) {
        return createResponse('NotFound', null, 'Review not found');
      }
      return createResponse('OK', updatedReview, 'Review updated successfully');
    } catch (error) {
      console.error('Error updating review:', error);
      return createResponse('ServerError', null, 'Failed to update review');
    }
  }

  async remove(id: string) {
    try {
      const result = await this.ratingsReviewsRepository.remove(id);
      if (!result) {
        return createResponse('NotFound', null, 'Review not found');
      }
      return createResponse('OK', null, 'Review deleted successfully');
    } catch (error) {
      console.error('Error deleting review:', error);
      return createResponse('ServerError', null, 'Failed to delete review');
    }
  }
}
