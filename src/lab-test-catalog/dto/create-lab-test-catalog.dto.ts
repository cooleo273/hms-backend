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
  sampleType: string;

  @IsString()
  @IsOptional()
  preparationInstructions?: string;

  @IsString()
  @IsOptional()
  turnAroundTime?: string;

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