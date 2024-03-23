import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import {CreateUserDto} from "../user/dto/create-user.dto";
import {UpdateUserDto} from "../user/dto/update-user.dto";
import {CreateContactDto} from "../contact/dto/create-contact.dto";

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) {}

    // Envoi d'un mail de confirmation à un nouveau utilisateur
    async sendConfirmationEmail(userData: CreateUserDto | UpdateUserDto, activationToken: string) {
        // Lien d'activitaion avec le token d'activitaion
        const url = `http://localhost:3000/auth/confirm-registration?token=${activationToken}`;

        console.log('User :', activationToken);

        // Envoi de l'email
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

    // Envoie d'un email de confirmation lors de la mise à jour d'un email
    async sendConfirmationEmailUpdated(email: string, activationToken: string) {
        // Lien d'activitaion avec le token d'activitaion
        const url = `http://localhost:3000/user/confirm-update-email?token=${activationToken}`;

        console.log('User :', activationToken);

        // Envoie de l'email
        await this.mailerService.sendMail({
            to: email,
            subject: 'Bienvenue chez SiteXplore ! Confirmez votre email d\'inscription !',
            template: 'confirmation-mail-updated',
            context: {
                url,
            },
        });
    }

    // Envoie d'un email de confrmation lors de l'oublie du mot de passe
    async sendConfirmationForgottenPassword(userData: UpdateUserDto, activationToken: string) {
        // Lien d'activitaion avec le token d'activitaion
        const url = `http://localhost:3000/auth/update-forgotten-password?token=${activationToken}`;

        console.log('User :', activationToken);

        // Envoie de l'email
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

    // Envoie d'un email de rappel à un utilisateur dont le compte est inactif
    async sendReminderInactiveAccount(user: UpdateUserDto) {

        // Envoie de l'email
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

    // Envoi d'un email à un utilisateur dont le compte inactif a été supprimé
    async sendDeleteInactiveAccount(userData: UpdateUserDto) {

        // Envoi de l'email
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

    // Envoie du message issu du formulaire de contact à l'adresse mail destinataire
    async sendMessageContact(createContactDto: CreateContactDto) {
        const { firstName, lastName, email, subject, content } = createContactDto;

        console.log('Contact :', createContactDto);

        // Envoie de l'email
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

    // Envoie d'un mail récapitulatif du message du formulaire de contact à l'utilisateur emetteur
    async sendRecapContact(createContactDto: CreateContactDto) {
        const { firstName, lastName, email, subject, content } = createContactDto;

        console.log('Contact :', createContactDto);

        // Envoie de l'email
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
