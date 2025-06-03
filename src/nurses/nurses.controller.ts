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
import { NursesService } from './nurses.service';
import { CreateNurseDto } from './dto/create-nurse.dto';
import { UpdateNurseDto } from './dto/update-nurse.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('nurses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NursesController {
  constructor(private readonly nursesService: NursesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createNurseDto: CreateNurseDto) {
    return this.nursesService.create(createNurseDto);
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
    return this.nursesService.findAll(
      search,
      department,
      specialization,
      sortBy,
      sortOrder,
    );
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  getNurseStats() {
    return this.nursesService.getNurseStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  findOne(@Param('id') id: string) {
    return this.nursesService.findOne(id);
  }

  @Get(':id/schedule')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  getNurseSchedule(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.nursesService.getNurseSchedule(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateNurseDto: UpdateNurseDto) {
    return this.nursesService.update(id, updateNurseDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.nursesService.remove(id);
  }
} 