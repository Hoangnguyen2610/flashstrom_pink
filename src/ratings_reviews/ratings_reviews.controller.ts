import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete
} from '@nestjs/common';
import { RatingsReviewsService } from './ratings_reviews.service';
import { CreateRatingsReviewDto } from './dto/create-ratings_review.dto';
import { UpdateRatingsReviewDto } from './dto/update-ratings_review.dto';

@Controller('ratings-reviews')
export class RatingsReviewsController {
  constructor(private readonly ratingsReviewsService: RatingsReviewsService) {}

  @Post()
  create(@Body() createRatingsReviewDto: CreateRatingsReviewDto) {
    return this.ratingsReviewsService.create(createRatingsReviewDto);
  }

  @Get()
  findAll() {
    return this.ratingsReviewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ratingsReviewsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRatingsReviewDto: UpdateRatingsReviewDto
  ) {
    return this.ratingsReviewsService.update(id, updateRatingsReviewDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ratingsReviewsService.remove(id);
  }
}
