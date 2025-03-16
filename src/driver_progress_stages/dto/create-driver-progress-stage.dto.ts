import {
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { Order } from 'src/orders/entities/order.entity';

// Sửa LocationDto: lat và lng là bắt buộc
class LocationDto {
  lat: number; // Không optional
  lng: number; // Không optional
}

class WeatherDto {
  @IsOptional()
  temperature?: number;

  @IsOptional()
  condition?: string;
}

class StageDetailsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  estimated_time?: number;

  @IsOptional()
  actual_time?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  tip?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => WeatherDto)
  weather?: WeatherDto;
}

export class StageDto {
  @IsString()
  state: string;

  @IsEnum(['pending', 'completed', 'in_progress', 'failed'])
  status: 'pending' | 'completed' | 'in_progress' | 'failed';

  timestamp: number;

  duration: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => StageDetailsDto)
  details?: StageDetailsDto;
}

class EventDetailsDto {
  @IsOptional()
  @ValidateNested()
  location?: {
    lat: number;
    lng: number;
  };

  @IsOptional()
  @IsString()
  notes?: string;
}

class EventDto {
  @IsEnum(['driver_start', 'pickup_complete', 'delivery_complete'])
  event_type: 'driver_start' | 'pickup_complete' | 'delivery_complete';

  event_timestamp: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => EventDetailsDto)
  event_details?: EventDetailsDto;
}

export class CreateDriverProgressStageDto {
  @IsString()
  driver_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Order)
  orders: Order[];

  @IsEnum([
    'driver_ready',
    'waiting_for_pickup',
    'restaurant_pickup',
    'en_route_to_customer',
    'delivery_complete'
  ])
  current_state:
    | 'driver_ready'
    | 'waiting_for_pickup'
    | 'restaurant_pickup'
    | 'en_route_to_customer'
    | 'delivery_complete';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StageDto)
  stages?: StageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  events?: EventDto[];

  @IsOptional()
  @IsString()
  previous_state?: string;

  @IsOptional()
  @IsString()
  next_state?: string;

  @IsOptional()
  estimated_time_remaining?: number;

  @IsOptional()
  actual_time_spent?: number;

  @IsOptional()
  total_distance_travelled?: number;

  @IsOptional()
  total_tips?: number;
}
