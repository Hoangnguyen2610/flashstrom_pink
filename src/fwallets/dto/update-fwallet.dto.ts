import { PartialType } from '@nestjs/mapped-types';
import { CreateFWalletDto } from './create-fwallet.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateFwalletDto extends PartialType(CreateFWalletDto) {
  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  user_id?: string;
}
