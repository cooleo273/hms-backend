import { IsString, IsOptional, IsDate, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMedicalRecordDto {
  @IsString()
  patientId: string;

  @IsString()
  doctorId: string;

  @IsString()
  recordedById: string;

  @IsDate()
  @Type(() => Date)
  visitDate: Date;

  @IsString()
  @IsOptional()
  chiefComplaint?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  diagnosis?: string[];

  @IsString()
  @IsOptional()
  treatmentPlan?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergiesAtVisit?: string[];

  @IsString()
  @IsOptional()
  appointmentId?: string;
} 