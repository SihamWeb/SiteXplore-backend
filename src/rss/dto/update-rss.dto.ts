import { PartialType } from '@nestjs/mapped-types';
import { CreateRssDto } from './create-rss.dto';

export class UpdateRssDto extends PartialType(CreateRssDto) {}
