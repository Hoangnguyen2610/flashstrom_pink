import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  IsEnum
} from 'class-validator';

export class CreateDriverProgressStageDto {
  @IsString()
  driver_id: string;

  @IsArray()
  @IsString({ each: true })
  order_ids: string[];

  @IsEnum([
    'driver_ready',
    'waiting_for_pickup',
    'restaurant_pickup',
    'en_route_to_customer',
    'customer_delivery',
    'delivery_complete'
  ])
  current_state: string;

  @IsOptional()
  @IsString()
  previous_state?: string;

  @IsOptional()
  @IsArray()
  state_history?: Array<{
    state: string;
    status: 'completed' | 'in_progress' | 'failed';
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

  @IsOptional()
  @IsString()
  next_state?: string;

  @IsOptional()
  @IsNumber()
  estimated_time_remaining?: number;

  @IsOptional()
  @IsNumber()
  actual_time_spent?: number;

  @IsOptional()
  @IsNumber()
  total_distance_travelled?: number;

  @IsOptional()
  @IsNumber()
  total_tips?: number;
}
