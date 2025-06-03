import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, AppointmentStatus } from '@prisma/client';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT)
  create(@Request() req, @Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(req.user.id, createAppointmentDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  findAll(
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.findAll({
      doctorId,
      patientId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('upcoming')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.PATIENT)
  getUpcomingAppointments(@Request() req) {
    return this.appointmentsService.getUpcomingAppointments(req.user.id);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  getPatientAppointments(@Param('patientId') patientId: string) {
    return this.appointmentsService.getPatientAppointments(patientId);
  }

  @Get('doctor/:doctorId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  getDoctorAppointments(@Param('doctorId') doctorId: string) {
    return this.appointmentsService.getDoctorAppointments(doctorId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.PATIENT)
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: AppointmentStatus; cancellationReason?: string },
  ) {
    return this.appointmentsService.updateStatus(id, body.status, body.cancellationReason);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  @Get('doctor/:doctorId/stats')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  getAppointmentStats(
    @Param('doctorId') doctorId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.appointmentsService.getAppointmentStats(
      doctorId,
      new Date(startDate),
      new Date(endDate),
    );
  }
} 