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
import { CreateDrugBatchDto } from './dto/create-drug-batch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { DrugBatchesService } from './drug-batches.service';
import { UpdateDrugBatchDto } from './dto/update-drug-batch.dto';

@Controller('drug-batches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DrugBatchesController {
  constructor(private readonly drugBatchesService: DrugBatchesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  create(@Body() createDrugBatchDto: CreateDrugBatchDto) {
    return this.drugBatchesService.create(createDrugBatchDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.NURSE)
  findAll(
    @Query('drugId') drugId?: string,
    @Query('expiringSoon') expiringSoon?: boolean,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('supplier') supplier?: string,
    @Query('sortBy') sortBy?: 'expiryDate' | 'manufacturingDate' | 'quantity',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.drugBatchesService.findAll({
      drugId,
      expiringSoon,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
      supplier,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.NURSE)
  findOne(@Param('id') id: string) {
    return this.drugBatchesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  update(
    @Param('id') id: string,
    @Body() updateDrugBatchDto: UpdateDrugBatchDto,
  ) {
    return this.drugBatchesService.update(id, updateDrugBatchDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.drugBatchesService.remove(id);
  }

  @Get('stats/expiration')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  getExpirationStats() {
    return this.drugBatchesService.getExpirationStats();
  }

  @Get('expiring-soon')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  getExpiringSoonBatches() {
    return this.drugBatchesService.getExpiringSoonBatches();
  }

  @Get('drug/:drugId/history')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  getDrugBatchHistory(@Param('drugId') drugId: string) {
    return this.drugBatchesService.getDrugBatchHistory(drugId);
  }

  @Patch(':id/adjust-quantity')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  adjustQuantity(
    @Param('id') id: string,
    @Body() body: { quantity: number; reason: string },
  ) {
    return this.drugBatchesService.adjustQuantity(id, body.quantity, body.reason);
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  getLowStockBatches() {
    return this.drugBatchesService.getLowStockBatches();
  }
} 