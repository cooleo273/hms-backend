import { PartialType } from '@nestjs/mapped-types';
import { CreateLabTestOrderDto } from './create-lab-test-order.dto';

export class UpdateLabTestOrderDto extends PartialType(CreateLabTestOrderDto) {} 