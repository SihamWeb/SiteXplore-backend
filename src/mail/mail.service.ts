import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import {CreateUserDto} from "../user/dto/create-user.dto";

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) {}

    async sendConfirmationEmail(userData: CreateUserDto, activationToken: string) {
        const url = `http://localhost:3000/confirm-registration?token=${activationToken}`;

        console.log('User :', activationToken);

        await this.mailerService.sendMail({
            to: userData.email,
            subject: 'Bienvenue chez SiteXplore ! Confirmez votre email d\'inscription !',
            template: 'confirmation-mail',
            context: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                url,
            },
        });
    }
}
