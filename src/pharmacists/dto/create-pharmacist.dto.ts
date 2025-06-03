import { IsString, IsEmail, IsOptional, IsDate, IsArray, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePharmacistDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  licenseNumber: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsArray()
  @IsString({ each: true })
  qualifications: string[];

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  licenseExpiryDate?: Date;

  @IsString()
  @IsOptional()
  notes?: string;
} 