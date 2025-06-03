import { IsString, IsNumber, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDispensedDrugDto {
  @IsString()
  prescriptionId: string;

  @IsString()
  drugBatchId: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDate()
  @Type(() => Date)
  dispensedAt: Date;

  @IsString()
  dispensedBy: string; // Pharmacist ID
} 