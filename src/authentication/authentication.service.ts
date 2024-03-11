import {
    Injectable,
    InternalServerErrorException, NotFoundException
} from '@nestjs/common';
import {AuthenticationPayloadDto} from "./dto/authentication.dto";
import {JwtService} from "@nestjs/jwt";
import {User} from "../user/entities/user.entity";
import {CreateUserDto} from "../user/dto/create-user.dto";
import * as bcrypt from 'bcrypt';
import {InjectModel} from "@nestjs/sequelize";
import {MailService} from "../mail/mail.service";
import {UserService} from "../user/user.service";
import {UpdateUserDto} from "../user/dto/update-user.dto";
import axios from "axios";

@Injectable()
export class AuthenticationService {

    constructor(
        @InjectModel(User)
        private readonly userRepository: typeof User,
        private jwtService: JwtService,
        private mailService: MailService,
        private userService: UserService,
    ) {}

    async register(userData: CreateUserDto): Promise<string> {
        const { email, firstName, lastName, password } = userData;

        if (firstName){
            if (lastName){
                if (email){
                    if (!(await this.userService.isValidEmail(email))) {
                        return 'L\'adresse email n\'est pas valide.' ;
                    } else {
                        const excistUser = await User.findOne({ where: { email } });
                        if (excistUser) {
                            return 'Un utilisateur avec cet email existe déjà.' ;
                        } else {
                            if (password){
                                if (!(await this.userService.isStrongPassword(password))) {
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

     async createUserFromToken(decodedToken: any): Promise<void> {
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
            return 'Utilisateur introuvable' ;
        } else {
            if (password){
                const comparePassword = await bcrypt.compare(password, user.password);
                if (comparePassword) {
                    const { password, ...userWithoutThePassword } = user.toJSON();

                    const userId = user.id;
                    await this.userService.updateLastConnection(userId);

                    return this.jwtService.sign(userWithoutThePassword);
                } else {
                    return 'Mot de passe incorrect';
                }
            } else {
                return 'Aucun mot de passe renseigné' ;
            }
        }
    }

    async forgottenPassword(userData: UpdateUserDto): Promise<string> {
        const { email, password } = userData;
        const excistUser = await User.findOne({ where: { email } });

        if (email){
            if (!excistUser) {
                return 'Aucun utilisateur avec cet adresse mail existe' ;
            } else {
                if (password){
                    if (!(await this.userService.isStrongPassword(password))) {
                        return 'Le mot de passe doit contenir minimum 8 caractères avec au moins une lettre n majuscule, une lettre minuscule, un chifre et un caractère spécial.' ;
                    } else {
                        const activationToken = this.jwtService.sign({ email, password});
                        await this.mailService.sendConfirmationForgottenPassword(userData, activationToken);
                        return 'Un email de confirmation a été envoyé avec succès';
                    }
                } else {
                    return 'Aucun mot de passe renseigné' ;
                }
            }
        } else {
            return 'Aucun email renseigné' ;
        }
    }

    async confirmForgottenPassword(activationToken: string): Promise<void> {
        const decodedToken = this.jwtService.verify(activationToken);
        const { email, password } = decodedToken;

        const excistUser = await this.userRepository.findOne({ where: { email } });
        if (!excistUser) {
            throw new Error('Aucun utilisateur avec cet adresse mail existe');
        }

        await this.updatePasswordFromToken(decodedToken);
    }

    private async updatePasswordFromToken(decodedToken: any): Promise<void> {
        const { email, password } = decodedToken;
        console.log(decodedToken);

        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                throw new NotFoundException('Utilisateur inexistant');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;

            await user.save();
        } catch (e) {
            throw new InternalServerErrorException('Une erreur est survenue lors de la modification du mot de passe.', decodedToken.emailOld);
        }
    }

    // Google
    async getNewAccessToken(refreshToken: string): Promise<string> {
        try {
            const response = await axios.post(
                'https://accounts.google.com/o/oauth2/token',
                {
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token',
                },
            );

            return response.data.access_token;
        } catch (error) {
            throw new Error('Failed to refresh the access token.');
        }
    }

    async getProfile(token: string) {
        try {
            return axios.get(
                `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`,
            );
        } catch (error) {
            console.error('Failed to revoke the token:', error);
        }
    }

    async isTokenExpired(token: string): Promise<boolean> {
        try {
            const response = await axios.get(
                `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`,
            );

            const expiresIn = response.data.expires_in;

            if (!expiresIn || expiresIn <= 0) {
                return true;
            }
        } catch (error) {
            return true;
        }
    }

    async revokeGoogleToken(token: string) {
        try {
            await axios.get(
                `https://accounts.google.com/o/oauth2/revoke?token=${token}`,
            );
        } catch (error) {
            console.error('Failed to revoke the token:', error);
        }
    }

}