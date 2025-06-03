import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsUUID, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDrugBatchDto {
  @IsUUID()
  @IsNotEmpty()
  drugId: string;

  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  quantity: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  manufacturingDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  expiryDate: Date;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  unitCost: number;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsString()
  @IsOptional()
  notes?: string;
} 