import {
  IsOptional,
  IsString,
  // IsNumber,
  ValidateNested,
  IsEnum,
  IsArray
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverProgressStageDto } from './create-driver-progress-stage.dto';

// class LocationDto {
//   @IsNumber()
//   @IsOptional()
//   lat: number;

//   @IsNumber()
//   @IsOptional()
//   lng: number;
// }

// class DetailsDto {
//   @ValidateNested()
//   @Type(() => LocationDto)
//   @IsOptional()
//   location?: LocationDto;

//   @IsString()
//   @IsOptional()
//   notes?: string;

//   @IsNumber()
//   @IsOptional()
//   tip?: number;

//   @ValidateNested()
//   @IsOptional()
//   weather?: {
//     temperature?: number;
//     condition?: string;
//   };
// }

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

export class UpdateDriverProgressStageDto extends PartialType(
  CreateDriverProgressStageDto
) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  events?: EventDto[];

  @IsOptional()
  updated_at?: number;
}
