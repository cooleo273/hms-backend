import { PartialType } from '@nestjs/mapped-types';
import { CreateVitalSignsDto } from './create-vital-signs.dto';

export class UpdateVitalSignsDto extends PartialType(CreateVitalSignsDto) {} 