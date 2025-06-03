import { Module } from '@nestjs/common';
import { LabTestOrdersService } from './lab-test-orders.service';
import { LabTestOrdersController } from './lab-test-orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LabTestCatalogModule } from '../lab-test-catalog/lab-test-catalog.module';

@Module({
  imports: [PrismaModule, LabTestCatalogModule],
  controllers: [LabTestOrdersController],
  providers: [LabTestOrdersService],
  exports: [LabTestOrdersService],
})
export class LabTestOrdersModule {} 