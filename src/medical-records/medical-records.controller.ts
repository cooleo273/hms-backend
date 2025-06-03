import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { Prisma } from '@prisma/client';

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  create(@Body() createMedicalRecordDto: CreateMedicalRecordDto) {
    return this.medicalRecordsService.create(createMedicalRecordDto);
  }

  @Get()
  findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: 'visitDate' | 'createdAt',
    @Query('sortOrder') sortOrder?: Prisma.SortOrder,
  ) {
    return this.medicalRecordsService.findAll(
      patientId,
      doctorId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicalRecordsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMedicalRecordDto: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.update(id, updateMedicalRecordDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicalRecordsService.remove(id);
  }

  @Get('patient/:patientId/history')
  getPatientMedicalHistory(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.medicalRecordsService.getPatientMedicalHistory(patientId);
  }

  @Get('doctor/:doctorId/records')
  getDoctorMedicalRecords(@Param('doctorId', ParseUUIDPipe) doctorId: string) {
    return this.medicalRecordsService.getDoctorMedicalRecords(doctorId);
  }

  @Get('stats/overview')
  getMedicalRecordStats() {
    return this.medicalRecordsService.getMedicalRecordStats();
  }
} 