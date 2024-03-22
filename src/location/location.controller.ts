import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Query,
  BadRequestException, InternalServerErrorException
} from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  findAll() {
    return this.locationService.findAll();
  }

  @Get('departments')
  async findAllDepartments() {
    try {
      const departments = await this.locationService.findAllDepartments();
      return departments;
    } catch (error) {
      throw new NotFoundException(error);
    }
  }

  @Get('periodes')
  async findAllPeriodes() {
    try {
      const periodes = await this.locationService.findAllPeriodes();
      return periodes;
    } catch (error) {
      throw new NotFoundException(error);
    }
  }

  @Get('filtres')
  async filtresLocations(
      @Query('startDate') startDate?: Date,
      @Query('endDate') endDate?: Date,
      @Query('department') department?: string,
      @Query('periode') periode?: string,
  ){
    console.log('Paramètres reçus :');
    console.log('startDate:', startDate);
    console.log('endDate:', endDate);
    console.log('department:', department);
    console.log('periode:', periode);
    try {
      const filtres = await this.locationService.filtresLocations(startDate, endDate, department, periode);
      return filtres;
    } catch (error) {
      console.error('Une erreur est survenue lors de la recherche des sites :', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Une erreur est survenue lors de la recherche des sites.');
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationService.findOne(+id);
  }

}
