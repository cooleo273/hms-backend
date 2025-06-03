import { Module } from '@nestjs/common';
import { VitalSignsService } from './vital-signs.service';
import { VitalSignsController } from './vital-signs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [PrismaModule, PatientsModule],
  controllers: [VitalSignsController],
  providers: [VitalSignsService],
  exports: [VitalSignsService],
})
export class VitalSignsModule {} 