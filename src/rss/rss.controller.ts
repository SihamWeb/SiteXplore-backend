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
  constructor(
      private readonly rssService: RssService
  ) {}

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
      throw new InternalServerErrorException(error);
    }
  }

  @Get()
  async findAll() {
    try {
      const articles = await this.rssService.findAll();
      return articles;
    } catch (error) {
      throw new NotFoundException('Il y a des erreurs dans la récupération de tous les articles');
    }
  }

  @Get('authors')
  async findAllAuthors() {
    try {
      const authors = await this.rssService.findAllAuthors();
      return authors;
    } catch (error) {
      throw new NotFoundException('Il y a des erreurs dans la récupération de tous les auteurs');
    }
  }

  @Get('categories')
  async findAllCategories() {
    try {
      const categories = await this.rssService.findAllCategories();
      return categories;
    } catch (error) {
      throw new NotFoundException('Il y a des erreurs dans la récupération de toutes les catégories');
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