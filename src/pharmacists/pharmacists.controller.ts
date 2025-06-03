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
import { PharmacistsService } from './pharmacists.service';
import { CreatePharmacistDto } from './dto/create-pharmacist.dto';
import { UpdatePharmacistDto } from './dto/update-pharmacist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('pharmacists')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PharmacistsController {
  constructor(private readonly pharmacistsService: PharmacistsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createPharmacistDto: CreatePharmacistDto) {
    return this.pharmacistsService.create(createPharmacistDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  findAll(
    @Query('search') search?: string,
    @Query('specialization') specialization?: string,
    @Query('sortBy') sortBy?: 'firstName' | 'lastName' | 'specialization',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.pharmacistsService.findAll(
      search,
      specialization,
      sortBy,
      sortOrder,
    );
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  getPharmacistStats() {
    return this.pharmacistsService.getPharmacistStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  findOne(@Param('id') id: string) {
    return this.pharmacistsService.findOne(id);
  }

  @Get(':id/dispensing-history')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  getPharmacistDispensingHistory(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.pharmacistsService.getPharmacistDispensingHistory(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updatePharmacistDto: UpdatePharmacistDto) {
    return this.pharmacistsService.update(id, updatePharmacistDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.pharmacistsService.remove(id);
  }
} 