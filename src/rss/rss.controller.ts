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
import {Rss} from "./entities/rss.entity";

@Controller('rss')
export class RssController {
  constructor(
      private readonly rssService: RssService
  ) {}

  // Alimentation de la base de données avec les feeds RSS
  @Post('create')
  async create(): Promise<void>{
    await this.rssService.create();
  }

  // Barre de recherche
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

  // Filtres des articles RSS
  @Get('filtres')
  async filtresArticles(
      @Query('startDate') startDate?: Date,
      @Query('endDate') endDate?: Date,
      @Query('author') author?: number,
      @Query('category') category?: number,
  ): Promise<Rss[]> {
    console.log('Paramètres reçus :');
    console.log('startDate:', startDate);
    console.log('endDate:', endDate);
    console.log('author:', author);
    console.log('category:', category);
    try {
      const filtres = await this.rssService.filtresArticles(startDate, endDate, author, category);
      return filtres;
    } catch (error) {
      console.error('Une erreur est survenue lors de la recherche des articles :', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Une erreur est survenue lors de la recherche des articles.');
    }
  }

// Récupérer tous les articles
  @Get()
  async findAll() {
    try {
      const articles = await this.rssService.findAll();
      return articles;
    } catch (error) {
      throw error;
    }
  }

  // Récupérer tous les auteurs
  @Get('authors')
  async findAllAuthors() {
    try {
      const authors = await this.rssService.findAllAuthors();
      return authors;
    } catch (error) {
      throw new NotFoundException(error);
    }
  }

  // Récupérer toutes les catégories
  @Get('categories')
  async findAllCategories() {
    try {
      const categories = await this.rssService.findAllCategories();
      return categories;
    } catch (error) {
      throw new NotFoundException(error);
    }
  }
}