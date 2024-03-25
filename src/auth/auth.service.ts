import {BadRequestException, Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
import {CreateUserDto} from "../user/dto/create-user.dto";
import {UpdateUserDto} from "../user/dto/update-user.dto";
import {User} from "../user/entities/user.entity";
import {InjectModel} from "@nestjs/sequelize";
import {JwtService} from "@nestjs/jwt";
import {MailService} from "../mail/mail.service";
import {UserService} from "../user/user.service";
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import {AuthenticationPayloadDto} from "./dto/auth.dto";
import {Cron} from "@nestjs/schedule";

@Injectable()
export class AuthService {

  constructor(
      @InjectModel(User)
      private readonly userRepository: typeof User,
      private jwtService: JwtService,
      private mailService: MailService,
      private userService: UserService,
  ) {}

  // Vérification que l'email soit valide
  async isValidEmail(email: string): Promise<boolean> {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Vérification si le mot de passe est fort
  async isStrongPassword(password: string): Promise<boolean> {
    return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/.test(password);
  }

  async register(userData: CreateUserDto): Promise<string> {
    const { email, firstName, lastName, password } = userData;

    // Vérification que tous les champs sont renseignés
    if (firstName){
      if (lastName){
        if (email){
          // Vérifier le format du mail saisi
          if (!(await this.isValidEmail(email))) {
            return 'L\'adresse email n\'est pas valide.' ;
          } else {
            // Vérifier qu'aucun utilisateur n'existe déjà avec cet email
            const excistUser = await User.findOne({ where: { email } });
            if (excistUser) {
              return 'Un utilisateur avec cet email existe déjà.' ;
            } else {
              if (password){
                // Vérifier que le mot de passe est assez fort
                if (!(await this.isStrongPassword(password))) {
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

    // Créer l'utilisateur à partir du token JWT vérifié
    // contenant les informations saisies par l'utilisateur
    await this.createUserFromToken(decodedToken);

    const { email, password, lastName, firstName } = decodedToken;
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
          await this.updateLastConnection(userId);
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
          if (!(await this.isStrongPassword(password))) {
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

  //User
  // Récupérer un utilisateur par son id (utilisateur connecté)
  async findMe(id: number) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundException(`L'user avec Id #${id} non trouvé`);
    }
    return user;
  }

  // Supprimer le compte utilisateur (utilisateur connecté)
  async removeMe(id: number) {
    const user = await User.destroy({ where: { id } });
    if (!user) {
      throw new NotFoundException(`L'user avec Id #${id} non trouvé`);
    }
    return `Suppression du compte réussie`;
  }

  // Mise à jour de la date de dernière connexion
  async updateLastConnection(userId: number) {
    // Recherche l'utilisateur par son id
    const user = await User.findByPk(userId);
    console.log('LastConnection : ', user);
    if (user) {
      // Met à jour la date avec la date et heure actuelle
      user.lastConnection = new Date();
      // Sauvegarde dans la base de données
      await user.save();
    }
  }

  // Les utilisateur mettent à jour leurs propres informations
  async update(userId: number, updateData: Partial<CreateUserDto>): Promise<User> {
    const { email, firstName, lastName, password } = updateData;

    // Recherche l'utilisateur par son id
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Si un email saisi
    if (updateData.email) {
      if (updateData.email !== user.email){
        // Vérification du format
        if (!(await this.isValidEmail(updateData.email))) {
          throw new BadRequestException('Le nouvel email n\'est pas valide');
        }

        // Vérification si l'email existe déjà ou pas
        const existingUser = await User.findOne({ where: { email: updateData.email } });
        if (existingUser) {
          throw new BadRequestException('Un utilisateur avec cet email existe déjà.');
        }

        // Fonction updateEmail pour envoie d'un mail de confirmation
        await this.updateEmail(user.email, updateData.email);

      } else {
        throw new BadRequestException('Saisissez un nouveau email');
      }
    }

    // Si un mot de passe est saisi
    if (updateData.password) {
      // Vérification de la fiabilité du mot de passe
      if (!(await this.isStrongPassword(updateData.password))) {
        throw new BadRequestException('Le nouveau mot de passe n\'est pas valide');
      }
      // Hashage du mot de passe
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      updateData.password = hashedPassword;
    }

    // Mise à jour des propriétés avec les nouvelles valeurs à partir de updateData
    Object.assign(user, { firstName, lastName, password: updateData.password });
    // Enregistrement dans la base de données
    await user.save();
    return user;
  }

  // Mise à jour d'un email,
  async updateEmail (emailOld: string, emailNew: string): Promise<void> {
    // Création d'un token JWT signé avec l'ancien et nouvel email
    const activationToken = this.jwtService.sign({ emailOld, emailNew });

    // Envoie du token et du nouveau mail au service mail
    await this.mailService.sendConfirmationEmailUpdated(emailNew, activationToken);
  }

  // Confirme la mise à jour de l'email
  async confirmUpdateEmail(activationToken: string): Promise<void> {
    // Token vérifié et décodé
    const decodedToken = this.jwtService.verify(activationToken);
    const { emailOld, emailNew } = decodedToken;

    const email = emailNew;

    const excistUser = await this.userRepository.findOne({ where: { email } });
    if (excistUser) {
      throw new Error('Un utilisateur avec cet email existe déjà.');
    }

    // Sollicite la fonction de mis eà jour de l'email à partir du token décodé
    await this.updateEmailFromToken(decodedToken);
  }

  // Mise à jour de l'email à partir du token
  private async updateEmailFromToken(decodedToken: any): Promise<void> {
    const { emailOld, emailNew } = decodedToken;

    const email = emailOld;

    console.log(decodedToken);

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // Modification de l'email avec le nouveau mail'
      user.email = emailNew;

      // Sauvagarde dans la base de données
      await user.save();
    } catch (e) {
      throw new InternalServerErrorException(e, decodedToken.emailOld);
    }
  }

  // Télécharge la photo de profil de l'utilisateur
  async uploadProfilePicture (userId: number, profilePictureName : string) : Promise<User>{
    const user = await User.findByPk(userId);

    console.log(profilePictureName);

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (!profilePictureName){
      throw new BadRequestException('Aucune image n\'est saisie');
    }

    // Modifie le nom de l'image avec la nouvelle image téléchargée
    user.profilePicture = profilePictureName;

    // Enregistrement dans la base de données
    await user.save();

    return user;
  }

  // Suppression de l'image de profil
  async deleteProfilePicture(userId: number): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (!user.profilePicture) {
      throw new BadRequestException('Aucune image de profil à supprimer');
    }

    // Suppression du nom déjà existant
    user.profilePicture = null;

    // Sauvegarde dans la base de données
    await user.save();
  }

  // Vérifier et supprimer les utilsiateurs inactifs
  // Tâche automatique tous les lundis à 8h
  @Cron('0 8 * * 1')
  async deleteInactiveUsers(): Promise<string> {
    // Récupère tous les utilisateurs
    const users = await this.userRepository.findAll();

    // Définition de la date pour le rappel (2 semaines avant les 2 ans écoulés)
    const beginReminder = moment()
        .subtract(2, 'years')
        .subtract(1, 'days');
    const warningExpiredSoon = moment()
        .subtract(2, 'years')
        .add(2, 'weeks');
    let countWarning = 0;

    // Définition de la date pour la suppression (2 ans)
    const expiredAccount = moment()
        .subtract(2, 'years')
        .toDate();
    let countExpired = 0;

    // Pour chaque utilisateur
    for (const user of users) {
      // Vérifier s'il doit recevoir un rappel
      if (moment(user.lastConnection).isBetween(warningExpiredSoon, beginReminder)) {
        console.log(warningExpiredSoon);
        console.log(beginReminder);
        // Si oui, envoie d'un mail de rappel
        await this.mailService.sendReminderInactiveAccount(user);
        countWarning++;
        continue;
      }

      // Vérifier si son compte soit être supprimé
      if (moment(user.lastConnection).isBefore(expiredAccount)) {
        // Si oui, envoie d'un mail pour lui informé que son compte a été supprimé
        await this.mailService.sendDeleteInactiveAccount(user);
        // Supprimer le compte
        await this.userRepository.destroy({ where: { id: user.id } });
        console.log(expiredAccount);
        countExpired++;
      }
    }

    // Message de retour
    if (countWarning === 0 && countExpired === 0) {
      const message = 'Aucun utilisateur à traiter.';
      console.log(message);
      return message;
    }

    let message = '';
    if (countWarning > 0) {
      message += `${countWarning} utilisateur(s) rappelé(s). `;
    }
    if (countExpired > 0) {
      message += `${countExpired} utilisateur(s) supprimé(s).`;
    }
    console.log(message);
    return message;
  }

  //Admin
  // Mise à jour du rôle administrateur d'un utilsiateur
  async updateAdminRole(userId: number, isAdmin: boolean, reqesterId: number): Promise<void> {
    // Vérification si l'utilisateur qui fait la demande est un administrateur
    const reqester = await this.userRepository.findByPk(reqesterId);
    if (!reqester || !reqester.isAdmin) {
      throw new BadRequestException('Vous ne disposez pas des autorisations nécessaires pour effectuer cette action.');
    }

    // Vérification si l'utilisateur à mettre à jour existe
    const userToUpdate = await this.userRepository.findByPk(userId);
    if (!userToUpdate) {
      throw new NotFoundException('Utilisateur à mettre à jour non trouvé.');
    }

    // Vérifications si la value de isAdmin est un booléen
    if (typeof isAdmin !== 'boolean') {
      throw new BadRequestException('Le champ isAdmin doit être un booléean.');
    }

    // Mise à jour du rôle administrateur de l'utilisateur
    // Enregistrement dans la base de données
    userToUpdate.isAdmin = isAdmin;
    await userToUpdate.save();
  }

  // Suppression d'un utilisateur
  async deleteUser(userId: number, reqesterId: number): Promise<void> {

    // Si admin
    const reqester = await this.userRepository.findByPk(reqesterId);
    if (!reqester || !reqester.isAdmin) {
      throw new BadRequestException('Vous ne disposez pas des autorisations nécessaires pour effectuer cette action.');
    }

    // Si utilisateur à supprimer existe
    const userToDelete = await this.userRepository.findByPk(userId);
    if (!userToDelete) {
      throw new NotFoundException('Utilisateur à supprimer non trouvé.');
    }
    // Supprimer
    await userToDelete.destroy();
  }

  // Récupérer tous les utilisateurs
  async findAll(reqesterId: number){
    // Si admin
    const reqester = await this.userRepository.findByPk(reqesterId);
    if (!reqester || !reqester.isAdmin) {
      throw new BadRequestException('Vous ne disposez pas des autorisations nécessaires pour effectuer cette action.');
    } else {
      const users = await User.findAll();
      if (users.length === 0) {
        throw new Error('Aucun user trouvé');
      }
      return users;
    }
  }

  // Récupérer un seul utilisateur par son id
  async findOne(userId: number, reqesterId: number): Promise<User> {
    // Si admin
    const reqester = await this.userRepository.findByPk(reqesterId);
    if (!reqester || !reqester.isAdmin) {
      throw new BadRequestException('Vous ne disposez pas des autorisations nécessaires pour effectuer cette action.');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException(`L'user avec Id #${userId} non trouvé`);
    }
    return user;
  }

}
