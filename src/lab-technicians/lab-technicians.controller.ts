import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LabTechniciansService } from './lab-technicians.service';
import { CreateLabTechnicianDto } from './dto/create-lab-technician.dto';
import { UpdateLabTechnicianDto } from './dto/update-lab-technician.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('lab-technicians')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabTechniciansController {
  constructor(private readonly labTechniciansService: LabTechniciansService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createLabTechnicianDto: CreateLabTechnicianDto) {
    return this.labTechniciansService.create(createLabTechnicianDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  findAll(
    @Query('search') search?: string,
    @Query('department') department?: string,
    @Query('specialization') specialization?: string,
    @Query('sortBy') sortBy?: 'firstName' | 'lastName' | 'department',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.labTechniciansService.findAll(
      search,
      department,
      specialization,
      sortBy,
      sortOrder,
    );
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  getLabTechnicianStats() {
    return this.labTechniciansService.getLabTechnicianStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  findOne(@Param('id') id: string) {
    return this.labTechniciansService.findOne(id);
  }

  @Get(':id/test-history')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  getLabTechnicianTestHistory(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.labTechniciansService.getLabTechnicianTestHistory(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateLabTechnicianDto: UpdateLabTechnicianDto) {
    return this.labTechniciansService.update(id, updateLabTechnicianDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.labTechniciansService.remove(id);
  }
} 