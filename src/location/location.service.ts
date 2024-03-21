import { Injectable } from '@nestjs/common';
import {Location} from "./entities/location.entity";

@Injectable()
export class LocationService {
  constructor(){}


  async findAll() {
    const locations = await Location.findAll();
    if (locations.length === 0){
      throw new Error ('Aucun site trouvé');
    }
    return locations;
  }

  findOne(id: number) {
    return `This action returns a #${id} location`;
  }


}
