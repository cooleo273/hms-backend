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
import { LabTestOrdersService } from './lab-test-orders.service';
import { CreateLabTestOrderDto } from './dto/create-lab-test-order.dto';
import { UpdateLabTestOrderDto } from './dto/update-lab-test-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, TestOrderStatus } from '@prisma/client';

@Controller('lab-test-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabTestOrdersController {
  constructor(private readonly labTestOrdersService: LabTestOrdersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  create(@Body() createLabTestOrderDto: CreateLabTestOrderDto) {
    return this.labTestOrdersService.create(createLabTestOrderDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN)
  findAll(
    @Query('patientId') patientId?: string,
    @Query('testCatalogId') testCatalogId?: string,
    @Query('status') status?: TestOrderStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: 'orderDate' | 'resultDate',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.labTestOrdersService.findAll(
      patientId,
      undefined, // medicalRecordId
      undefined, // orderedById
      undefined, // processedById
      testCatalogId,
      status,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN)
  findOne(@Param('id') id: string) {
    return this.labTestOrdersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  update(
    @Param('id') id: string,
    @Body() updateLabTestOrderDto: UpdateLabTestOrderDto,
  ) {
    return this.labTestOrdersService.update(id, updateLabTestOrderDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.labTestOrdersService.remove(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: TestOrderStatus,
  ) {
    return this.labTestOrdersService.update(id, { status });
  }

  @Get('stats/overview')
  @Roles(UserRole.ADMIN)
  getTestOrderStats() {
    return this.labTestOrdersService.getTestOrderStats();
  }

  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN)
  getPatientTestOrders(@Param('patientId') patientId: string) {
    return this.labTestOrdersService.getPatientTestOrders(patientId);
  }
} 