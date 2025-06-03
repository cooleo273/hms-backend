import { IsString, IsEmail, IsOptional, IsDate, IsArray, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLabTechnicianDto {
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

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  licenseExpiryDate?: Date;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsArray()
  @IsString({ each: true })
  qualifications: string[];

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
} 