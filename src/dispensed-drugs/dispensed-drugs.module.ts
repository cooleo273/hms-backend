import { Module } from '@nestjs/common';
import { DispensedDrugsService } from './dispensed-drugs.service';
import { DispensedDrugsController } from './dispensed-drugs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { DrugBatchesModule } from '../drug-batches/drug-batches.module';

@Module({
  imports: [PrismaModule, PrescriptionsModule, DrugBatchesModule],
  controllers: [DispensedDrugsController],
  providers: [DispensedDrugsService],
  exports: [DispensedDrugsService],
})
export class DispensedDrugsModule {} 