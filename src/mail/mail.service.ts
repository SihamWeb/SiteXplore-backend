import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import {CreateUserDto} from "../user/dto/create-user.dto";
import {UpdateUserDto} from "../user/dto/update-user.dto";
import {CreateContactDto} from "../contact/dto/create-contact.dto";

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

    async sendMessageContact(createContactDto: CreateContactDto) {
        const { firstName, lastName, email, subject, content } = createContactDto;

        console.log('Contact :', createContactDto);

        await this.mailerService.sendMail({
            to: 'contact.sitexplore@gmail.com',
            subject: 'Message reçu sur SiteXplore : ' + subject,
            template: 'message-contact',
            context: {
                firstName: firstName,
                lastName: lastName,
                email: email,
                subject: subject,
                content: content
            },
        });
    }

    async sendRecapContact(createContactDto: CreateContactDto) {
        const { firstName, lastName, email, subject, content } = createContactDto;

        console.log('Contact :', createContactDto);

        await this.mailerService.sendMail({
            to: email,
            subject: 'Message récapitulatif de votre message sur SiteXplore',
            template: 'recap-message-contact',
            context: {
                firstName: firstName,
                lastName: lastName,
                email: email,
                subject: subject,
                content: content
            },
        });
    }
}
