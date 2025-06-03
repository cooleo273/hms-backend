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
import { VitalSignsService } from './vital-signs.service';
import { CreateVitalSignsDto } from './dto/create-vital-signs.dto';
import { UpdateVitalSignsDto } from './dto/update-vital-signs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('vital-signs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VitalSignsController {
  constructor(private readonly vitalSignsService: VitalSignsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.NURSE)
  create(@Body() createVitalSignsDto: CreateVitalSignsDto) {
    return this.vitalSignsService.create(createVitalSignsDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  findAll(
    @Query('patientId') patientId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: 'timestamp' | 'temperature' | 'heartRate',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.vitalSignsService.findAll(
      patientId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  findOne(@Param('id') id: string) {
    return this.vitalSignsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.NURSE)
  update(
    @Param('id') id: string,
    @Body() updateVitalSignsDto: UpdateVitalSignsDto,
  ) {
    return this.vitalSignsService.update(id, updateVitalSignsDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.vitalSignsService.remove(id);
  }

  @Get('stats/:patientId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  getVitalSignsStats(@Param('patientId') patientId: string) {
    return this.vitalSignsService.getVitalSignsStats(patientId);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  getPatientVitalSigns(@Param('patientId') patientId: string) {
    return this.vitalSignsService.getPatientVitalSigns(patientId);
  }
} 