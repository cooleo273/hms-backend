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
  Request,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createDoctorDto: CreateDoctorDto, @Request() req) {
    return this.doctorsService.create(req.user.id, createDoctorDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('specialization') specialization?: string,
    @Query('search') search?: string,
  ) {
    return this.doctorsService.findAll({
      departmentId,
      specialization,
      search,
    });
  }

  @Get('me')
  @Roles(UserRole.DOCTOR)
  findMe(@Request() req) {
    return this.doctorsService.findByUserId(req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorsService.update(id, updateDoctorDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }

  @Get(':id/appointments')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  getDoctorAppointments(@Param('id') id: string) {
    return this.doctorsService.getDoctorAppointments(id);
  }

  @Get(':id/schedule')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  getDoctorSchedule(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.doctorsService.getDoctorSchedule(id, new Date(date));
  }

  @Get(':id/available-slots')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  getAvailableTimeSlots(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.doctorsService.getAvailableTimeSlots(id, new Date(date));
  }

  @Get('department/:departmentId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  getDepartmentDoctors(@Param('departmentId') departmentId: string) {
    return this.doctorsService.findAll({ departmentId });
  }

  @Get('stats/overview')
  @Roles(UserRole.ADMIN)
  getDoctorStats(@Request() req) {
    return this.doctorsService.getDoctorStats(req.user.id);
  }
} 