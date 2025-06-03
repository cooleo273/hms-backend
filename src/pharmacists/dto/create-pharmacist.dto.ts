import { IsString, IsEmail, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePharmacistDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  licenseExpiryDate?: Date;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsString()
  @IsOptional()
  notes?: string;
} 