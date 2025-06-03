import { IsString, IsDate, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePatientDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @Type(() => Date)
  @IsDate()
  dateOfBirth: Date;

  @IsString()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender: string;

  @IsString()
  address: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  medicalHistory?: string;

  @IsString()
  @IsOptional()
  insuranceInfo?: string;
} 