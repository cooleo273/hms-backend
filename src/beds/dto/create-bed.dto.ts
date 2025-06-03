import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateBedDto {
  @IsString()
  bedNumber: string;

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  ward?: string;

  @IsBoolean()
  @IsOptional()
  isOccupied?: boolean;

  @IsString()
  @IsOptional()
  bedType?: string;

  @IsString()
  @IsOptional()
  notes?: string;
} 