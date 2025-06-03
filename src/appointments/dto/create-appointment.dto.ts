import { IsString, IsUUID, IsDateString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'The ID of the patient',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  patientId: string;

  @ApiProperty({
    description: 'The ID of the doctor',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsUUID()
  doctorId: string;

  @ApiProperty({
    description: 'The date and time of the appointment',
    example: '2024-03-20T14:30:00Z'
  })
  @IsDateString()
  dateTime: string;

  @ApiProperty({
    description: 'Duration of the appointment in minutes',
    minimum: 15,
    maximum: 120,
    required: false,
    example: 30
  })
  @IsInt()
  @Min(15)
  @Max(120)
  @IsOptional()
  durationMinutes?: number;

  @ApiProperty({
    description: 'Status of the appointment',
    enum: AppointmentStatus,
    example: AppointmentStatus.SCHEDULED
  })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiProperty({
    description: 'Reason for the appointment',
    required: false,
    example: 'Regular checkup'
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({
    description: 'Additional notes about the appointment',
    required: false,
    example: 'Patient requested morning appointment'
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Reason for cancellation if the appointment is cancelled',
    required: false,
    example: 'Patient requested rescheduling'
  })
  @IsString()
  @IsOptional()
  cancellationReason?: string;
} 