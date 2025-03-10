import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  IsObject,
  IsNumber
} from 'class-validator';

export class CreateMenuItemVariantDto {
  @IsOptional()
  @IsString()
  menu_id: string; // The ID of the related menu item

  @IsString()
  variant: string; // Name or type of the variant (e.g., "small", "large", "extra spicy")

  @IsOptional()
  @IsString()
  description: string; // Description of the variant

  @IsOptional()
  @IsObject()
  avatar: {
    key: string; // Key of the avatar image
    url: string; // URL for the avatar image
  };

  @IsOptional()
  @IsBoolean()
  availability: boolean; // Availability of the variant (true/false)

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  default_restaurant_notes: string[]; // Default notes for the restaurant

  @IsNumber()
  price: number; // Price of the variant

  @IsOptional()
  @IsNumber()
  discount_rate: number; // Discount rate in percentage (0-100)
}

export class MenuItemVariantDto {
  @IsOptional()
  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  variant?: string;
}
