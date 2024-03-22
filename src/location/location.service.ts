import { Injectable } from '@nestjs/common';
import {Location} from "./entities/location.entity";
import { Sequelize } from 'sequelize-typescript';
import {Op} from "sequelize";
import * as moment from "moment-timezone";

@Injectable()
export class LocationService {
  constructor(
      private sequelize: Sequelize
  ){}


  async findAll() {
    const locations = await Location.findAll();
    if (locations.length === 0){
      throw new Error ('Aucun site trouvé');
    }
    return locations;
  }

  async findAllDepartments(){
    const departments = await Location.findAll(
        {
          attributes: [
              [
                  this.sequelize.fn('DISTINCT', this.sequelize.col('Departement')), 'Departement'
              ]
          ],
          raw: true,
        }
    );
    if (!departments || departments.length === 0) {
      throw new Error('Aucun département trouvé');
    }
    return departments.map(department => department.Departement);
  }

  async findAllPeriodes(){
    const periodes = await Location.findAll({
      attributes: [
        [
          this.sequelize.fn('DISTINCT', this.sequelize.col('Periodes')), 'Periodes'
        ]
      ],
      raw: true,
    });
    if (!periodes || periodes.length === 0) {
      throw new Error('Aucune période trouvé');
    }

    const allPeriodesInOneString = periodes.map(periode => periode.Periodes).join(',');

    const extractPeriodes = allPeriodesInOneString.split(',').map(periode => periode.trim());

    const periodesWithoutDoublon = [...new Set(extractPeriodes)].filter(periode => periode !== '');

    return periodesWithoutDoublon;
  }

  async filtresLocations (startDate: Date, endDate: Date, department: string, periode: string){
    let where: any = {};

    if (
        !startDate &&
        !endDate &&
        !department &&
        !periode
    ) {
      console.log('AUCUN PARAMETRE');
      const locations = await this.findAll();
      return locations;
    }

    if (department) {
      where.Departement = department;
    }

    if (periode) {
      where.Periodes = {
        [Op.like]: `%${periode}%`
      };
    }

    if (startDate && endDate) {
      where['Debut'] = {
        [Op.gte]: moment(startDate).tz('Europe/Paris'),
        [Op.lte]: moment(endDate).tz('Europe/Paris'),
      };
    } else if (startDate) {
      where['Debut'] = {
        [Op.gte]: moment(startDate).tz('Europe/Paris'),
      };
    } else if (endDate) {
      where['Fin'] = {
        [Op.lte]: moment(endDate).tz('Europe/Paris'),
      };
    }

    const locations = await Location.findAll({where});
    return locations;
  }

  findOne(id: number) {
    return `This action returns a #${id} location`;
  }
}
