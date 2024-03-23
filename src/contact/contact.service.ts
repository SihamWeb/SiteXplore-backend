import {BadRequestException, Injectable} from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import {UserService} from "../user/user.service";
import {MailService} from "../mail/mail.service";

@Injectable()
export class ContactService {

  constructor(
      private userService: UserService,
      private mailService: MailService,
  ) {}

  // Soumission du formulaire de contact
  async create(createContactDto: CreateContactDto) {
    const { firstName, lastName, email, subject, content } = createContactDto;

    // Vérification que tous les champs obligatoires sont saisis
    if (firstName){
      if (lastName){
        if (email){
          // Vérification si l'email est valide
          if (!(await this.userService.isValidEmail(email))) {
            throw new BadRequestException('L\email renseigné n\'est pas valide');
          }
          if (subject){
            if (content){

              // Envoie du mesage au destinataire
              await this.mailService.sendMessageContact(createContactDto)
              // Envoi du message récapitulatif à l'emetteur
              await this.mailService.sendRecapContact(createContactDto);
              return 'Message bien envoyé';

            } else {
              return 'Aucun message renseigné';
            }
          } else {
            return 'Aucun sujet renseigné';
          }
        } else {
          return 'Aucun email renseigné';
        }
      } else {
        return 'Aucun nom renseigné';
      }
    } else {
      return 'Aucun prénom renseigné';
    }
  }
}
