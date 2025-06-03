import { IsString, IsOptional, IsUUID, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { TestOrderStatus } from '@prisma/client';

export class UpdateLabTestOrderDto {
  @IsUUID()
  @IsOptional()
  patientId?: string;

  @IsUUID()
  @IsOptional()
  medicalRecordId?: string;

  @IsUUID()
  @IsOptional()
  orderedById?: string;

  @IsUUID()
  @IsOptional()
  processedById?: string;

  @IsUUID()
  @IsOptional()
  testCatalogId?: string;

  @IsString()
  @IsOptional()
  sampleId?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  sampleCollectedAt?: Date;

  @IsString()
  @IsOptional()
  result?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  resultDate?: Date;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  status?: TestOrderStatus;
} 