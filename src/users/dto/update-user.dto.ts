import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsDate, IsNumber } from 'class-validator';
import { Enum_AppTheme } from 'src/types/Payload';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  readonly verification_code?: string;
  @IsOptional()
  @IsNumber()
  readonly balance?: number;

  @IsOptional()
  readonly password?: string;

  @IsOptional()
  readonly app_preferences?: { theme: Enum_AppTheme };

  @IsOptional()
  @IsDate()
  readonly last_login?: Date;
}
