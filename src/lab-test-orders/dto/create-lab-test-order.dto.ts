import { IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TestOrderStatus } from '@prisma/client';

export class TestItemDto {
  @IsString()
  testId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateLabTestOrderDto {
  @IsString()
  patientId: string;

  @IsString()
  doctorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestItemDto)
  tests: TestItemDto[];

  @IsString()
  @IsOptional()
  clinicalNotes?: string;

  @IsEnum(TestOrderStatus)
  @IsOptional()
  status?: TestOrderStatus;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  sampleCollectionInstructions?: string;
} 