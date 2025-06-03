import { Module } from '@nestjs/common';
import { AdmissionsService } from './admissions.service';
import { AdmissionsController } from './admissions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdmissionsController],
  providers: [AdmissionsService],
  exports: [AdmissionsService],
})
export class AdmissionsModule {} 