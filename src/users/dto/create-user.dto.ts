import {
  IsString,
  IsEmail,
  IsEnum,
  IsArray,
  IsBoolean,
  IsOptional,
  IsObject
} from 'class-validator';
import { Enum_UserType } from 'src/types/Payload';

export class CreateUserDto {
  @IsOptional()
  readonly verification_code?: string;

  // Changed from CreateUserNeonDto
  @IsString()
  readonly first_name: string;

  @IsString()
  readonly password: string;

  @IsString()
  readonly last_name: string;

  @IsEmail()
  readonly email: string;

  @IsOptional()
  @IsString()
  readonly phone: string;

  @IsOptional()
  @IsEnum(Enum_UserType, { each: true })
  readonly user_type: Enum_UserType[];

  @IsOptional()
  @IsArray()
  readonly address: string[];

  @IsObject()
  @IsOptional()
  readonly avatar: { url: string; key: string };

  @IsOptional()
  @IsBoolean()
  readonly is_verified: boolean;
}
