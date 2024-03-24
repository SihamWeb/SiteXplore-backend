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

  // Récupération de tous les sites
  async findAll() {
    const locations = await Location.findAll();
    if (locations.length === 0){
      throw new Error ('Aucun site trouvé');
    }
    return locations;
  }

  // Récupère tous les département distincts
  async findAllDepartments(){
    const departments = await Location.findAll(
        {
          attributes: [
              [
                  // Fonction DISTINCT de Sequelize pour éviter les doublons
                  this.sequelize.fn('DISTINCT', this.sequelize.col('Departement')), 'Departement'
              ]
          ],
          raw: true,
        }
    );
    if (!departments || departments.length === 0) {
      throw new Error('Aucun département trouvé');
    }

    // Renvoie un tableau avec uniquement les noms des départements
    return departments.map(department => department.Departement);
  }

  // Récupère toutes les périodes
  async findAllPeriodes(){
    const periodes = await Location.findAll({
      attributes: [
        [
          // Fonction DISTINCT de Sequelize pour éviter les doublons
          this.sequelize.fn('DISTINCT', this.sequelize.col('Periodes')), 'Periodes'
        ]
      ],
      raw: true,
    });
    if (!periodes || periodes.length === 0) {
      throw new Error('Aucune période trouvé');
    }

    // Toutes les péridoes en une seule chaîne de caractères
    const allPeriodesInOneString = periodes.map(periode => periode.Periodes).join(',');

    // Extraire les périodes de cette chaîne en prenant en compte les ","
    const extractPeriodes = allPeriodesInOneString.split(',').map(periode => periode.trim());

    // Traitement des doublons et des chaînes vides
    const periodesWithoutDoublon = [...new Set(extractPeriodes)].filter(periode => periode !== '');

    // Renvoie un tableau avec les noms des périodes uniques
    return periodesWithoutDoublon;
  }

  // FIltres des sites
  async filtresLocations (startDate: Date, endDate: Date, department: string, periode: string){
    // Objet qui contiendra les conditions
    let where: any = {};

    // Si aucun filtre saisi mais le formulaire est soumis
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
      // Ajout du département saisi à la condition de recherche
      where.Departement = department;
    }

    if (periode) {
      // Ajout de la période saisie à la condition de recherche
      where.Periodes = {
        // "Like" pour rechercher si la période saisie est disponible parmi les périodes du site
        [Op.like]: `%${periode}%`
      };
    }

    // Si une date de début &/ou de fin est saisi,
    // elles sont ajouté à la condition de recherche
    if (startDate && endDate) {
        // "gte" pour vérifier les sites ayant une date de début supérieure ou égale à la date saisie
        // "lte" pour vérifier les sites ayant une date de fin inférieure ou égale à la date saisie
        // "moment" pour avoir les dates au fuseau horaire 'Europe/Paris' et ne pas avoir une heure en moins
        where['Debut'] = {
          [Op.gte]: moment(startDate).tz('Europe/Paris'),
        };
        where['Fin'] = {
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

    // Récupère et retourne tous les sites qui correspondent à la condition de recherche
    const locations = await Location.findAll({where});
    return locations;
  }

  findOne(id: number) {
    return `This action returns a #${id} location`;
  }
}
