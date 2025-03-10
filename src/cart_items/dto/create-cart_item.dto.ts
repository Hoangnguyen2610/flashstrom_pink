import { IsOptional, IsString } from 'class-validator';

export class CreateCartItemDto {
  @IsString()
  item_id: string;

  @IsOptional()
  variants: {
    variant_id: string;
    quantity: number;
  }[];

  @IsString()
  @IsOptional()
  customer_id: string;

  @IsString()
  @IsOptional()
  restaurant_id: string;
}
