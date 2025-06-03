import { PartialType } from '@nestjs/mapped-types';
import { CreateDrugBatchDto } from './create-drug-batch.dto';

export class UpdateDrugBatchDto extends PartialType(CreateDrugBatchDto) {} 