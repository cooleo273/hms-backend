import { Module } from '@nestjs/common';
import { LabTechniciansService } from './lab-technicians.service';
import { LabTechniciansController } from './lab-technicians.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [LabTechniciansController],
  providers: [LabTechniciansService],
  exports: [LabTechniciansService],
})
export class LabTechniciansModule {} 