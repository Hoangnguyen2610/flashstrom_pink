import { Injectable } from '@nestjs/common';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { Promotion } from './entities/promotion.entity';
import { createResponse } from 'src/utils/createResponse';
import { ApiResponse } from 'src/utils/createResponse';
import { v4 as uuidv4 } from 'uuid';
import { PromotionsRepository } from './promotions.repository';

@Injectable()
export class PromotionsService {
  constructor(private readonly promotionsRepository: PromotionsRepository) {}

  async create(
    createPromotionDto: CreatePromotionDto
  ): Promise<ApiResponse<Promotion>> {
    try {
      const existingPromotion = await this.promotionsRepository.findByName(
        createPromotionDto.name
      );
      if (existingPromotion) {
        return createResponse(
          'DuplicatedRecord',
          null,
          'Promotion with this name already exists'
        );
      }

      const savedPromotion = await this.promotionsRepository.create({
        ...createPromotionDto,
        id: `FF_PROMO_${uuidv4()}`
      });

      return createResponse(
        'OK',
        savedPromotion,
        'Promotion created successfully'
      );
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error creating promotion');
    }
  }

  async findAll(): Promise<ApiResponse<Promotion[]>> {
    try {
      const promotions = await this.promotionsRepository.findAll();
      return createResponse(
        'OK',
        promotions,
        'Promotions retrieved successfully'
      );
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error fetching promotions');
    }
  }

  async findOne(id: string): Promise<ApiResponse<Promotion>> {
    try {
      const promotion = await this.promotionsRepository.findById(id);
      if (!promotion) {
        return createResponse('NotFound', null, 'Promotion not found');
      }
      return createResponse(
        'OK',
        promotion,
        'Promotion retrieved successfully'
      );
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error fetching promotion');
    }
  }

  async update(
    id: string,
    updatePromotionDto: UpdatePromotionDto
  ): Promise<ApiResponse<Promotion>> {
    try {
      const promotion = await this.promotionsRepository.findById(id);
      if (!promotion) {
        return createResponse('NotFound', null, 'Promotion not found');
      }

      await this.promotionsRepository.update(id, updatePromotionDto);
      const updatedPromotion = await this.promotionsRepository.findById(id);
      return createResponse(
        'OK',
        updatedPromotion,
        'Promotion updated successfully'
      );
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error updating promotion');
    }
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      const result = await this.promotionsRepository.delete(id);
      if (result.affected === 0) {
        return createResponse('NotFound', null, 'Promotion not found');
      }
      return createResponse('OK', null, 'Promotion deleted successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error deleting promotion');
    }
  }
}
