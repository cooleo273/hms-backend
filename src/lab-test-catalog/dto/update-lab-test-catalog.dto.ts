import { PartialType } from '@nestjs/mapped-types';
import { CreateLabTestCatalogDto } from './create-lab-test-catalog.dto';

export class UpdateLabTestCatalogDto extends PartialType(CreateLabTestCatalogDto) {} 