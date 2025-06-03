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
import { BedsService } from './beds.service';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('beds')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.NURSE)
  create(@Body() createBedDto: CreateBedDto) {
    return this.bedsService.create(createBedDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR)
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('isOccupied') isOccupied?: boolean,
    @Query('bedType') bedType?: string,
  ) {
    return this.bedsService.findAll({ departmentId, isOccupied, bedType });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR)
  findOne(@Param('id') id: string) {
    return this.bedsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.NURSE)
  update(
    @Param('id') id: string,
    @Body() updateBedDto: UpdateBedDto,
  ) {
    return this.bedsService.update(id, updateBedDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.bedsService.remove(id);
  }

  @Get('department/:departmentId')
  @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR)
  getDepartmentBeds(@Param('departmentId') departmentId: string) {
    return this.bedsService.getDepartmentBeds(departmentId);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.NURSE)
  updateBedStatus(
    @Param('id') id: string,
    @Body() body: { isOccupied: boolean },
  ) {
    return this.bedsService.updateBedStatus(id, body.isOccupied);
  }

  @Get('stats/overview')
  @Roles(UserRole.ADMIN, UserRole.NURSE)
  getBedStats() {
    return this.bedsService.getBedStats();
  }

  @Get('available')
  @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR)
  getAvailableBeds(
    @Query('departmentId') departmentId?: string,
    @Query('bedType') bedType?: string,
  ) {
    return this.bedsService.getAvailableBeds(departmentId, bedType);
  }
} 