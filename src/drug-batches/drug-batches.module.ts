import { Module } from '@nestjs/common';
import { DrugBatchesService } from './drug-batches.service';
import { DrugBatchesController } from './drug-batches.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DrugBatchesController],
  providers: [DrugBatchesService],
  exports: [DrugBatchesService],
})
export class DrugBatchesModule {} 