import { PartialType } from '@nestjs/mapped-types';
import { CreateCartItemDto } from './create-cart_item.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCartItemDto extends PartialType(CreateCartItemDto) {
  @IsOptional()
  @IsString()
  item_id: string;

  @IsOptional()
  variants: {
    variant_id: string;
    quantity: number;
  }[];

  @IsOptional()
  @IsString()
  customer_id: string;

  @IsString()
  @IsOptional()
  restaurant_id: string;

  @IsNumber()
  @IsOptional()
  updated_at: number;
}
