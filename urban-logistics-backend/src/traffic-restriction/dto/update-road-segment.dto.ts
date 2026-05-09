import { PartialType } from '@nestjs/swagger';
import { CreateRoadSegmentDto } from './create-road-segment.dto';

export class UpdateRoadSegmentDto extends PartialType(CreateRoadSegmentDto) {}
