import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsUUID } from 'class-validator';
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
  @IsUUID()
  patientId: string;

  @IsUUID()
  @IsOptional()
  medicalRecordId?: string;

  @IsUUID()
  orderedById: string;

  @IsUUID()
  testCatalogId: string;

  @IsString()
  @IsOptional()
  notes?: string;

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