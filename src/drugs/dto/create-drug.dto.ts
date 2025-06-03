import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';

export class CreateDrugDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  minimumQuantity: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  unitPrice: number;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  storageLocation?: string;

  @IsString()
  @IsOptional()
  notes?: string;
} 