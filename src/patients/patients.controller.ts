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
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  create(@Request() req, @Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(req.user.id, createPatientDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  findAll() {
    return this.patientsService.findAll();
  }

  @Get('profile')
  @Roles(UserRole.PATIENT)
  findProfile(@Request() req) {
    return this.patientsService.findByUserId(req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  update(
    @Param('id') id: string,
    @Body() updatePatientDto: Partial<CreatePatientDto>,
  ) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }

  @Get(':id/appointments')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.PATIENT)
  getPatientAppointments(@Param('id') id: string) {
    return this.patientsService.getPatientAppointments(id);
  }

  @Get(':id/invoices')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT)
  getPatientInvoices(@Param('id') id: string) {
    return this.patientsService.getPatientInvoices(id);
  }
} 