import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Request() req, @Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorsService.create(req.user.id, createDoctorDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('specialization') specialization?: string,
    @Query('search') search?: string,
  ) {
    return this.doctorsService.findAll({ departmentId, specialization, search });
  }

  @Get('me')
  @Roles(Role.DOCTOR)
  findMe(@Request() req) {
    return this.doctorsService.findByUserId(req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.DOCTOR)
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorsService.update(id, updateDoctorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }

  @Get(':id/appointments')
  @Roles(Role.ADMIN, Role.DOCTOR)
  getDoctorAppointments(@Param('id') id: string) {
    return this.doctorsService.getDoctorAppointments(id);
  }

  @Get(':id/schedule')
  @Roles(Role.ADMIN, Role.DOCTOR)
  getDoctorSchedule(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.doctorsService.getDoctorSchedule(id, new Date(date));
  }

  @Get(':id/available-slots')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  getAvailableTimeSlots(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.doctorsService.getAvailableTimeSlots(id, new Date(date));
  }

  @Get(':id/stats')
  @Roles(Role.ADMIN, Role.DOCTOR)
  getDoctorStats(@Param('id') id: string) {
    return this.doctorsService.getDoctorStats(id);
  }
} 