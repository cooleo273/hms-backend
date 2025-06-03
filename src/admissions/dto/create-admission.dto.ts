import { IsString, IsNotEmpty, IsDate, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAdmissionDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  bedId: string;

  @IsUUID()
  @IsNotEmpty()
  admittingDoctorId: string;

  @IsUUID()
  @IsNotEmpty()
  processedById: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  admissionDate: Date;

  @IsString()
  @IsOptional()
  admissionReason?: string;

  @IsString()
  @IsOptional()
  initialDiagnosis?: string;

  @IsString()
  @IsOptional()
  notes?: string;
} 