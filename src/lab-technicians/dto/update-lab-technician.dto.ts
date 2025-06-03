import { IsString, IsOptional, IsUUID, IsDate, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLabTechnicianDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  qualifications?: string[];

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