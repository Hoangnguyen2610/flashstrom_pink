import {
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
  IsEnum,
  IsArray
} from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsNumber()
  @IsOptional()
  lat: number;

  @IsNumber()
  @IsOptional()
  lng: number;
}

class DetailsDto {
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  tip?: number;

  @ValidateNested()
  @IsOptional()
  weather?: {
    temperature?: number;
    condition?: string;
  };
}

export class UpdateDriverProgressStageDto {
  @IsEnum([
    'driver_ready',
    'waiting_for_pickup',
    'restaurant_pickup',
    'en_route_to_customer',
    'delivery_complete'
  ])
  @IsOptional()
  current_state?:
    | 'driver_ready'
    | 'waiting_for_pickup'
    | 'restaurant_pickup'
    | 'en_route_to_customer'
    | 'delivery_complete';

  @IsOptional()
  @IsString()
  previous_state?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  order_ids?: string[];

  @IsOptional()
  @IsArray()
  stages?: Array<{
    state: string;
    status: 'completed' | 'in_progress' | 'pending' | 'failed';
    timestamp: Date;
    duration: number;
    details?: {
      location?: {
        lat: number;
        lng: number;
      };
      estimated_time?: number;
      actual_time?: number;
      notes?: string;
      tip?: number;
      weather?: {
        temperature?: number;
        condition?: string;
      };
    };
  }>;

  @ValidateNested()
  @Type(() => DetailsDto)
  @IsOptional()
  details?: DetailsDto;
}
