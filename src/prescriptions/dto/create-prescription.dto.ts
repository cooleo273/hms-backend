import { IsString, IsOptional, IsDate, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePrescriptionDto {
  @IsString()
  patientId: string;

  @IsString()
  doctorId: string;

  @IsArray()
  @IsString({ each: true })
  drugIds: string[];

  @IsString()
  @IsOptional()
  dosage?: string;

  @IsString()
  @IsOptional()
  frequency?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsDate()
  @Type(() => Date)
  prescriptionDate: Date;

  @IsString()
  @IsOptional()
  status?: 'ACTIVE' | 'FILLED' | 'CANCELLED';

  @IsString()
  @IsOptional()
  notes?: string;
} 