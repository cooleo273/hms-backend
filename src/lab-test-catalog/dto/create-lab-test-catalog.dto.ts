import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateLabTestCatalogDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  specimenType?: string;

  @IsString()
  @IsOptional()
  preparationInstructions?: string;

  @IsNumber()
  @IsOptional()
  turnaroundTime?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  referenceRange?: string;

  @IsString()
  @IsOptional()
  unit?: string;
} 