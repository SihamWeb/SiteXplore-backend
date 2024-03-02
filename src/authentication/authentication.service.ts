import {ConflictException, Injectable, InternalServerErrorException} from '@nestjs/common';
import {AuthenticationPayloadDto} from "./dto/authentication.dto";
import {JwtService} from "@nestjs/jwt";
import {User} from "../user/entities/user.entity";
import {CreateUserDto} from "../user/dto/create-user.dto";
import * as bcrypt from 'bcrypt';
import {InjectModel} from "@nestjs/sequelize";
import {MailerService} from "@nestjs-modules/mailer";
import {MailService} from "../mail/mail.service";

@Injectable()
export class AuthenticationService {

    constructor(
        @InjectModel(User)
        private readonly userRepository: typeof User,
        private jwtService: JwtService,
        private mailerService: MailerService,
        private mailService: MailService
    ) {}

    async isValidEmail(email: string): Promise<boolean> {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    async isStrongPassword(password: string): Promise<boolean> {
        return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/.test(password);
    }

    async register(userData: CreateUserDto): Promise<string> {
        const { email, firstName, lastName, password } = userData;

        if (firstName){
            if (lastName){
                if (email){
                    if (!(await this.isValidEmail(email))) {
                        return 'L\'adresse email n\'est pas valide.' ;
                    } else {
                        const excistUser = await User.findOne({ where: { email } });
                        if (excistUser) {
                            return 'Un utilisateur avec cet email existe déjà.' ;
                        } else {
                            if (password){
                                if (!(await this.isStrongPassword(password))) {
                                    return 'Le mot de passe doit contenir minimum 8 caractères avec au moins une lettre n majuscule, une lettre minuscule, un chifre et un caractère spécial.' ;
                                } else {
                                    const activationToken = this.jwtService.sign({ email, password, lastName, firstName });
                                    await this.mailService.sendConfirmationEmail(userData, activationToken);
                                    return 'Un email de confirmation a été envoyé avec succès';
                                }
                            } else {
                                return 'Aucun mot de passe renseigné' ;
                            }
                        }
                    }
                } else {
                    return 'Aucun email renseigné' ;
                }
            } else {
                return 'Aucun nom renseigné' ;
            }
        } else {
            return 'Aucun prénom renseigné' ;
        }
    }



    async confirmRegistration(activationToken: string): Promise<void> {
        const decodedToken = this.jwtService.verify(activationToken);
        const { email, password, lastName, firstName } = decodedToken;

        const excistUser = await this.userRepository.findOne({ where: { email } });
        if (excistUser) {
            throw new Error('L\'utilisateur existe déjà.');
        }

        await this.createUserFromToken(decodedToken);
    }

    private async createUserFromToken(decodedToken: any): Promise<void> {
        const { email, password, lastName, firstName } = decodedToken;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User();
        user.email = email;
        user.password = hashedPassword;
        user.lastName = lastName;
        user.firstName = firstName;

        try {
            await user.save();
        } catch (e) {
            throw new InternalServerErrorException('Une erreur est survenue lors de la création de l\'utilisateur.');
        }
    }

    async validateUser({ email, password }: AuthenticationPayloadDto) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return { error: 'Utilisateur introuvable' };
        }
        const comparePassword = await bcrypt.compare(password, user.password);
        if (comparePassword) {
            const { password, ...userWithoutThePassword } = user.toJSON();
            return this.jwtService.sign(userWithoutThePassword);
        } else {
            return { error: 'Mot de passe invalide' };
        }
    }
}