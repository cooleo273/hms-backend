import { IsString, IsNumber, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVitalSignsDto {
  @IsString()
  patientId: string;

  @IsString()
  recordedBy: string; // Nurse ID

  @IsNumber()
  temperature: number; // in Celsius

  @IsNumber()
  heartRate: number; // beats per minute

  @IsNumber()
  bloodPressureSystolic: number; // mmHg

  @IsNumber()
  bloodPressureDiastolic: number; // mmHg

  @IsNumber()
  respiratoryRate: number; // breaths per minute

  @IsNumber()
  oxygenSaturation: number; // percentage

  @IsNumber()
  @IsOptional()
  painLevel?: number; // 0-10 scale

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDate()
  @Type(() => Date)
  recordedAt: Date;
} 