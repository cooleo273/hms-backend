import { IsString, IsUUID, IsDate, IsOptional, IsBoolean } from 'class-validator';

export class CreateStaffDto {
  @IsUUID()
  userId: string;

  @IsString()
  employeeId: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsDate()
  dateOfJoining: Date;

  @IsString()
  @IsOptional()
  shift?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 