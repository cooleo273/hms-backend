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
import { DrugsService } from './drugs.service';
import { CreateDrugDto } from './dto/create-drug.dto';
import { UpdateDrugDto } from './dto/update-drug.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('drugs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DrugsController {
  constructor(private readonly drugsService: DrugsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  create(@Body() createDrugDto: CreateDrugDto) {
    return this.drugsService.create(createDrugDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.NURSE)
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('inStock') inStock?: boolean,
  ) {
    return this.drugsService.findAll({ search, category, inStock });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.NURSE)
  findOne(@Param('id') id: string) {
    return this.drugsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  update(@Param('id') id: string, @Body() updateDrugDto: UpdateDrugDto) {
    return this.drugsService.update(id, updateDrugDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.drugsService.remove(id);
  }

  @Get(':id/batches')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  getDrugBatches(
    @Param('id') id: string,
    @Query('expiringSoon') expiringSoon?: boolean,
  ) {
    return this.drugsService.getDrugBatches(id, expiringSoon);
  }

  @Get('stats/inventory')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  getInventoryStats() {
    return this.drugsService.getInventoryStats();
  }

  @Get('categories')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.NURSE)
  getDrugCategories() {
    return this.drugsService.getDrugCategories();
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  getLowStockDrugs() {
    return this.drugsService.getLowStockDrugs();
  }

  @Get('expiring-soon')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  getExpiringSoonDrugs() {
    return this.drugsService.getExpiringSoonDrugs();
  }
} 