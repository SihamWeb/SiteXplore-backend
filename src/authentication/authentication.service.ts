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

@Injectable()
export class AuthenticationService {

    constructor(
        @InjectModel(User)
        private readonly userRepository: typeof User,
        private jwtService: JwtService,
        private mailService: MailService,
        private userService: UserService,
    ) {}

    // Inscription
    async register(userData: CreateUserDto): Promise<string> {
        const { email, firstName, lastName, password } = userData;

        // Vérification que tous les champs sont renseignés
        if (firstName){
            if (lastName){
                if (email){
                    // Vérifier le format du mail saisi
                    if (!(await this.userService.isValidEmail(email))) {
                        return 'L\'adresse email n\'est pas valide.' ;
                    } else {
                        // Vérifier qu'aucun utilisateur n'existe déjà avec cet email
                        const excistUser = await User.findOne({ where: { email } });
                        if (excistUser) {
                            return 'Un utilisateur avec cet email existe déjà.' ;
                        } else {
                            if (password){
                                // Vérifier que le mot de passe est assez fort
                                if (!(await this.userService.isStrongPassword(password))) {
                                    return 'Le mot de passe doit contenir minimum 8 caractères avec au moins une lettre n majuscule, une lettre minuscule, un chifre et un caractère spécial.' ;
                                } else {
                                    // Si tout est respecté, envoyer un mail de confirmation + créer un token JWT
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

    // Confirmation par email de l'inscription
    async confirmRegistration(activationToken: string): Promise<{ message: string; token: string }> {
        const decodedToken = this.jwtService.verify(activationToken);
        const { email, password, lastName, firstName } = decodedToken;

        const excistUser = await this.userRepository.findOne({ where: { email } });
        if (excistUser) {
            throw new Error('L\'utilisateur existe déjà.');
        }

        // Création de l'utilisateur avec le token JWT vérifié
        // contenant les informations saisies par l'utilisateur
        await this.createUserFromToken(decodedToken);

        const token = this.jwtService.sign({ email, password, lastName, firstName });
        console.log('confirmRegistration token : ' + token);
        return {
            message: 'Inscription confirmée avec succès',
            token: token
        };
    }

    // Création de l'utilisateur suite à son isncription
    private async createUserFromToken(decodedToken: any): Promise<void> {
        const { email, password, lastName, firstName } = decodedToken;

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        //Création d'une nouvelle instance de l'objet User
        const user = new User();

        // Définition des propriétés de l'objet avec les valeurs de l'utilisateur
        user.email = email;
        user.password = hashedPassword;
        user.lastName = lastName;
        user.firstName = firstName;

        try {
            // Sauvegarde de l'utilisateur dans la base de données
            await user.save();
            // Validation des informations d'identification de 'utilisateur
            await this.validateUser({ email, password });
        } catch (e) {
            // Si erreur,
            throw new InternalServerErrorException(e);
        }
    }

    // Connexion : validation des informations d'authentification de l'utilisateur
    async validateUser({ email, password }: AuthenticationPayloadDto) {
        // Aucun email saisi
        if (!email) {
            return {
                error : 'Aucun email renseigné'
            };
        }

        // Vérifie si l'email saisi est bien inscrit dans la base de données
        const user = await User.findOne({ where: { email } });

        // Utilisateur non trouvé
        if (!user) {
            return {
                error : 'Identifiants invalides'
            };
        // Utilisateur trouvé
        } else {
            if (password) {
                // Comparaison mot de passe saisi avec le mot de passe hashé qui est dans la base de données
                const comparePassword = await bcrypt.compare(password, user.password);
                // Si validation
                if (comparePassword) {
                    // SUppression du mot de passe de l'objet utilisateur
                    const { password, ...userWithoutThePassword } = user.toJSON();

                    // Mise à jour de la dernière connexion de l'utilisateur
                    const userId = user.id;
                    await this.userService.updateLastConnection(userId);
                    console.log('Connexion réussie');

                    // Message de succès retournée avec un token JWT signé
                    return {
                        message: 'Connexion avec succès',
                        token: this.jwtService.sign(userWithoutThePassword)
                    };
                } else {
                    // Si identifiants invalides
                    return {
                        error : 'Identifiants invalides'
                    };
                }
            } else {
                return {
                    error : 'Aucun mot de passe renseigné'
                };
            }
        }
    }

    // Mot de passe oublié
    async forgottenPassword(userData: UpdateUserDto): Promise<string> {
        const { email, password } = userData;

        // Vérification de l'existance de l'utilisateur avec l'email saisi
        const excistUser = await User.findOne({ where: { email } });

        if (email){
            if (!excistUser) {
                return 'Aucun utilisateur avec cet adresse mail existe' ;
            } else {
                if (password){
                    // Vérification si le mot de passe est fort
                    if (!(await this.userService.isStrongPassword(password))) {
                        return 'Le mot de passe doit contenir minimum 8 caractères avec au moins une lettre n majuscule, une lettre minuscule, un chifre et un caractère spécial.' ;
                    } else {
                        // Envoie d'un mail de confirmation avec un token d'activitation
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

    // Confirmation mot de passe oublié
    async confirmForgottenPassword(activationToken: string): Promise<void> {
        // Vérification et décodage du token d'activiation
        // pour obtenir l'email et le mot de passe
        const decodedToken = this.jwtService.verify(activationToken);
        const { email, password } = decodedToken;

        // Vérification si l'utilisateur existe
        const excistUser = await this.userRepository.findOne({ where: { email } });
        if (!excistUser) {
            throw new Error('Aucun utilisateur avec cet adresse mail existe');
        }

        // Mise à jour du mot de passe avec le token decodé
        await this.updatePasswordFromToken(decodedToken);
    }

    // Mise à jour du mot de passe oublié
    private async updatePasswordFromToken(decodedToken: any): Promise<void> {
        const { email, password } = decodedToken;
        console.log(decodedToken);

        try {
            // Chercher l'utilisateur avec l'email saisi
            const user = await User.findOne({ where: { email } });
            if (!user) {
                throw new NotFoundException('Identifiants invalides');
            }

            // Hashage du mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);
            // Mise à jour du mot de passe
            user.password = hashedPassword;

            // Sauvegarde dans la base de données
            await user.save();
        } catch (e) {
            throw new InternalServerErrorException(e, decodedToken.emailOld);
        }
    }

}