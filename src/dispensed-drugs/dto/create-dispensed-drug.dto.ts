import { IsString, IsNumber, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDispensedDrugDto {
  @IsString()
  prescriptionId: string;

  @IsString()
  batchId: string;

  @IsNumber()
  quantityDispensed: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  dispensedById: string; // Pharmacist ID
} 