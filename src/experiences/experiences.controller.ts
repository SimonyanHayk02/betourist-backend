import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExperiencesService } from './experiences.service';
import { ListExperiencesQueryDto } from './dto/list-experiences.query.dto';

@ApiTags('experiences')
@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @ApiOperation({ summary: 'List experiences (public, published-only)' })
  @Get()
  async list(@Query() query: ListExperiencesQueryDto) {
    return await this.experiencesService.list(query);
  }

  @ApiOperation({ summary: 'Get experience details (public, published-only)' })
  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.experiencesService.getById(id);
  }
}


