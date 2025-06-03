import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AdmissionsService } from './admissions.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateAdmissionDto } from './dto/update-admission.dto';

@Controller('admissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  create(@Body() createAdmissionDto: CreateAdmissionDto) {
    return this.admissionsService.create(createAdmissionDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  findAll(
    @Query('patientId') patientId?: string,
    @Query('bedId') bedId?: string,
    @Query('admittingDoctorId') admittingDoctorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.admissionsService.findAll({
      patientId,
      bedId,
      admittingDoctorId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  findOne(@Param('id') id: string) {
    return this.admissionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  update(
    @Param('id') id: string,
    @Body() updateAdmissionDto: UpdateAdmissionDto,
  ) {
    return this.admissionsService.update(id, updateAdmissionDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.admissionsService.remove(id);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  getPatientAdmissions(@Param('patientId') patientId: string) {
    return this.admissionsService.getPatientAdmissions(patientId);
  }

  @Get('bed/:bedId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  getBedAdmissions(@Param('bedId') bedId: string) {
    return this.admissionsService.getBedAdmissions(bedId);
  }

  @Patch(':id/discharge')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  dischargePatient(
    @Param('id') id: string,
    @Body() body: { dischargeDate: Date; dischargeReason?: string },
  ) {
    return this.admissionsService.dischargePatient(
      id,
      body.dischargeDate,
      body.dischargeReason,
    );
  }

  @Get('stats/overview')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  getAdmissionStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.admissionsService.getAdmissionStats(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('current/active')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  getActiveAdmissions() {
    return this.admissionsService.getActiveAdmissions();
  }
} 