import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
  BadRequestException, HttpException, InternalServerErrorException
} from '@nestjs/common';
import { RssService } from './rss.service';
import { CreateRssDto } from './dto/create-rss.dto';
import { UpdateRssDto } from './dto/update-rss.dto';

@Controller('rss')
export class RssController {
  constructor(private readonly rssService: RssService) {}

  @Post('create')
  async create(): Promise<void>{
    await this.rssService.create();
  }

  // Search bar
  @Get('search')
  async searchArticles(@Query('query') query: string) {
    try {
      const articles = await this.rssService.searchArticles(query);
      return articles;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Une erreur est survenue lors de la recherche des articles.');
    }
  }

  /*@Post()
  create(@Body() createRssDto: CreateRssDto) {
    return this.rssService.create(createRssDto);
  }

  @Get()
  findAll() {
    return this.rssService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rssService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRssDto: UpdateRssDto) {
    return this.rssService.update(+id, updateRssDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rssService.remove(+id);
  }*/
}