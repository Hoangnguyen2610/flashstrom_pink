import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RatingsReview } from './entities/ratings_review.entity';
import { CreateRatingsReviewDto } from './dto/create-ratings_review.dto';
import { UpdateRatingsReviewDto } from './dto/update-ratings_review.dto';

@Injectable()
export class RatingsReviewsRepository {
  constructor(
    @InjectRepository(RatingsReview)
    private repository: Repository<RatingsReview>
  ) {}

  async create(createDto: CreateRatingsReviewDto): Promise<RatingsReview> {
    const review = this.repository.create(createDto);
    return await this.repository.save(review);
  }

  async findAll(query: Record<string, any> = {}): Promise<RatingsReview[]> {
    return await this.repository.find({ where: query });
  }

  async findById(id: string): Promise<RatingsReview> {
    return await this.repository.findOne({ where: { id } });
  }

  async findOne(query: Record<string, any>): Promise<RatingsReview> {
    return await this.repository.findOne({ where: query });
  }

  async update(
    id: string,
    updateDto: UpdateRatingsReviewDto
  ): Promise<RatingsReview> {
    await this.repository.update(id, {
      ...updateDto,
      updated_at: Math.floor(Date.now() / 1000)
    });
    return await this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}
