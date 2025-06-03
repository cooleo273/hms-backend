import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNurseDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsString()
  licenseNumber: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  qualifications?: string[];

  @IsString()
  departmentId: string;
} 