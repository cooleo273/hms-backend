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
import { LabTestCatalogService } from './lab-test-catalog.service';
import { CreateLabTestCatalogDto } from './dto/create-lab-test-catalog.dto';
import { UpdateLabTestCatalogDto } from './dto/update-lab-test-catalog.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('lab-test-catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabTestCatalogController {
  constructor(private readonly labTestCatalogService: LabTestCatalogService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  create(@Body() createLabTestCatalogDto: CreateLabTestCatalogDto) {
    return this.labTestCatalogService.create(createLabTestCatalogDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.DOCTOR, UserRole.NURSE)
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: boolean,
    @Query('sortBy') sortBy?: 'name' | 'price' | 'category',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.labTestCatalogService.findAll(
      search,
      category,
      isActive,
      sortBy,
      sortOrder,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.DOCTOR, UserRole.NURSE)
  findOne(@Param('id') id: string) {
    return this.labTestCatalogService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  update(
    @Param('id') id: string,
    @Body() updateLabTestCatalogDto: UpdateLabTestCatalogDto,
  ) {
    return this.labTestCatalogService.update(id, updateLabTestCatalogDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.labTestCatalogService.remove(id);
  }

  @Get('categories/all')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.DOCTOR, UserRole.NURSE)
  getCategories() {
    return this.labTestCatalogService.getCategories();
  }

  @Get('stats/overview')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  getTestStats() {
    return this.labTestCatalogService.getTestStats();
  }
} 