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

    async sendConfirmationForgottenPassword(userData: UpdateUserDto, activationToken: string) {
        const url = `http://localhost:3000/update-forgotten-password?token=${activationToken}`;

        console.log('User :', activationToken);

        await this.mailerService.sendMail({
            to: userData.email,
            subject: 'Bienvenue chez SiteXplore ! Confirmez votre modification de mot de passe suite à un oubli !',
            template: 'confirmation-forgotten-password',
            context: {
                email: userData.email,
                url,
            },
        });
    }

    async sendReminderInactiveAccount(user: UpdateUserDto) {

        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Compte inactif bientôt supprimé !',
            template: 'reminder-inactive-account',
            context: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            },
        });
    }

    async sendDeleteInactiveAccount(userData: UpdateUserDto) {

        await this.mailerService.sendMail({
            to: userData.email,
            subject: 'Compte inactif supprimé !',
            template: 'delete-inactive-account',
            context: {
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName
            },
        });
    }
}
