import { IsString, IsArray, IsUUID, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  specialization: string;

  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(100, { each: true })
  qualifications: string[];

  @IsUUID()
  @IsNotEmpty()
  departmentId: string;
} 