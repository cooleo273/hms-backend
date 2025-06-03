import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DispenseStatus } from '@prisma/client';

export class CreatePrescriptionDto {
  @IsString()
  medicalRecordId: string;

  @IsString()
  patientId: string;

  @IsString()
  prescribedById: string;

  @IsString()
  medicationName: string;

  @IsString()
  dosage: string;

  @IsString()
  @IsOptional()
  form?: string;

  @IsString()
  @IsOptional()
  route?: string;

  @IsString()
  frequency: string;

  @IsString()
  duration: string;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsEnum(DispenseStatus)
  @IsOptional()
  dispenseStatus?: DispenseStatus;
} 