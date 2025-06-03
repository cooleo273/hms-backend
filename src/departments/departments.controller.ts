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
import { CreateDepartmentDto } from './dto/create-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsService } from './departments.service';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.DOCTOR, UserRole.NURSE)
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.DOCTOR, UserRole.NURSE)
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }

  @Get(':id/doctors')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.DOCTOR, UserRole.NURSE)
  getDepartmentDoctors(@Param('id') id: string) {
    return this.departmentsService.getDepartmentDoctors(id);
  }

  @Get(':id/staff')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  getDepartmentStaff(@Param('id') id: string) {
    return this.departmentsService.getDepartmentStaff(id);
  }

  @Get(':id/beds')
  @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR)
  getDepartmentBeds(@Param('id') id: string) {
    return this.departmentsService.getDepartmentBeds(id);
  }

  @Get(':id/stats')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  getDepartmentStats(@Param('id') id: string) {
    return this.departmentsService.getDepartmentStats(id);
  }
} 