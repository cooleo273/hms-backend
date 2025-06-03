import { PartialType } from '@nestjs/mapped-types';
import { CreateLabTechnicianDto } from './create-lab-technician.dto';

export class UpdateLabTechnicianDto extends PartialType(CreateLabTechnicianDto) {} 