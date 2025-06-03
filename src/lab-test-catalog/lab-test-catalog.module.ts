import { Module } from '@nestjs/common';
import { LabTestCatalogService } from './lab-test-catalog.service';
import { LabTestCatalogController } from './lab-test-catalog.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LabTestCatalogController],
  providers: [LabTestCatalogService],
  exports: [LabTestCatalogService],
})
export class LabTestCatalogModule {} 