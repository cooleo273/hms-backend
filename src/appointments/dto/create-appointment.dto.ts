import { IsString, IsUUID, IsDateString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  doctorId: string;

  @IsDateString()
  dateTime: string;

  @IsInt()
  @Min(15)
  @Max(120)
  @IsOptional()
  durationMinutes?: number;

  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  cancellationReason?: string;
} 