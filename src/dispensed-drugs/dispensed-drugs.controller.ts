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
import { DispensedDrugsService } from './dispensed-drugs.service';
import { CreateDispensedDrugDto } from './dto/create-dispensed-drug.dto';
import { UpdateDispensedDrugDto } from './dto/update-dispensed-drug.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('dispensed-drugs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DispensedDrugsController {
  constructor(private readonly dispensedDrugsService: DispensedDrugsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  create(@Body() createDispensedDrugDto: CreateDispensedDrugDto) {
    return this.dispensedDrugsService.create(createDispensedDrugDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  findAll(
    @Query('patientId') patientId?: string,
    @Query('drugId') drugId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: 'quantityDispensed' | 'dispenseDate',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.dispensedDrugsService.findAll(
      patientId,
      drugId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  findOne(@Param('id') id: string) {
    return this.dispensedDrugsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  update(
    @Param('id') id: string,
    @Body() updateDispensedDrugDto: UpdateDispensedDrugDto,
  ) {
    return this.dispensedDrugsService.update(id, updateDispensedDrugDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.dispensedDrugsService.remove(id);
  }

  @Get('stats/overview')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  getDispensedDrugStats() {
    return this.dispensedDrugsService.getDispensedDrugStats();
  }

  @Get('prescription/:prescriptionId')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  getPrescriptionDispensedDrugs(@Param('prescriptionId') prescriptionId: string) {
    return this.dispensedDrugsService.getPrescriptionDispensedDrugs(prescriptionId);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  getPatientDispensedDrugs(@Param('patientId') patientId: string) {
    return this.dispensedDrugsService.getPatientDispensedDrugs(patientId);
  }

  // @Get('drug/:drugId')
  // @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  // getDrugDispensingHistory(@Param('drugId') drugId: string) {
  //   return this.dispensedDrugsService.getDrugDispensingHistory(drugId);
  // }
} 