import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  IsObject,
  IsNumber,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountDto } from 'src/discounts/discount.dto';
import { MenuItemVariantDto } from 'src/menu_item_variants/dto/create-menu_item_variant.dto';

export class CreateMenuItemDto {
  @IsString()
  restaurant_id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsArray()
  @IsString({ each: true })
  category: string[];

  @IsOptional()
  @IsObject()
  avatar?: {
    key: string;
    url: string;
  };

  @IsOptional()
  @IsBoolean()
  availability?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suggest_notes?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemVariantDto)
  variants?: MenuItemVariantDto[];

  @IsOptional()
  @IsObject()
  discount?: DiscountDto;
}
