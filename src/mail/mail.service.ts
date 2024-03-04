import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import {CreateUserDto} from "../user/dto/create-user.dto";
import {UpdateUserDto} from "../user/dto/update-user.dto";

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) {}

    async sendConfirmationEmail(userData: CreateUserDto | UpdateUserDto, activationToken: string) {
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

    async sendConfirmationEmailUpdated(email: string, activationToken: string) {
        const url = `http://localhost:3000/user/confirm-update-email?token=${activationToken}`;

        console.log('User :', activationToken);

        await this.mailerService.sendMail({
            to: email,
            subject: 'Bienvenue chez SiteXplore ! Confirmez votre email d\'inscription !',
            template: 'confirmation-mail-updated',
            context: {
                url,
            },
        });
    }
}
