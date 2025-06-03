import { PartialType } from '@nestjs/mapped-types';
import { CreateDispensedDrugDto } from './create-dispensed-drug.dto';

export class UpdateDispensedDrugDto extends PartialType(CreateDispensedDrugDto) {} 