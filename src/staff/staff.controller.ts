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
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('jobTitle') jobTitle?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.staffService.findAll({ departmentId, jobTitle, isActive });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, updateStaffDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }

  @Get(':id/schedule')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  getStaffSchedule(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.staffService.getStaffSchedule(id, new Date(startDate), new Date(endDate));
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  updateStaffStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.staffService.updateStaffStatus(id, body.isActive);
  }

  @Get('department/:departmentId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  getDepartmentStaff(@Param('departmentId') departmentId: string) {
    return this.staffService.getDepartmentStaff(departmentId);
  }

  @Get('stats/overview')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  getStaffStats() {
    return this.staffService.getStaffStats();
  }
} 