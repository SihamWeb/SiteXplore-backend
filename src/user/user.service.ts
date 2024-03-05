import {BadRequestException, Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import {User} from "./entities/user.entity";
import {MailService} from "../mail/mail.service";
import * as bcrypt from 'bcrypt';
import {JwtService} from "@nestjs/jwt";
import {InjectModel} from "@nestjs/sequelize";


@Injectable()
export class UserService {

  constructor(
    @InjectModel(User)
    private readonly userRepository: typeof User,
    private jwtService: JwtService,
    private mailService: MailService
  ) {}

  async isValidEmail(email: string): Promise<boolean> {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async isStrongPassword(password: string): Promise<boolean> {
    return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/.test(password);
  }

  // Update lastConnection date each time when the user connect
  async updateLastConnection(userId: number) {
    const user = await User.findByPk(userId);
    console.log('LastConnection : ', user);
    if (user) {
      user.lastConnection = new Date();
      await user.save();
    }
  }

  //Users update their own informations
  async update(userId: number, updateData: Partial<CreateUserDto>): Promise<User> {
    const { email, firstName, lastName, password } = updateData;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (updateData.email) {
      if (updateData.email !== user.email){
        if (!(await this.isValidEmail(updateData.email))) {
          throw new BadRequestException('Le nouvel email n\'est pas valide');
        }

        const existingUser = await User.findOne({ where: { email: updateData.email } });
        if (existingUser) {
          throw new BadRequestException('Un utilisateur avec cet email existe déjà');
        }

        await this.updateEmail(user.email, updateData.email);

      } else {
        throw new BadRequestException('Saisissez un nouveau email');
      }
    }

    if (updateData.password) {
      if (!(await this.isStrongPassword(updateData.password))) {
        throw new BadRequestException('Le nouveau mot de passe n\'est pas valide');
      }
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      updateData.password = hashedPassword;
    }

    Object.assign(user, { firstName, lastName, password: updateData.password });
    await user.save();
    return user;
  }

  async updateEmail (emailOld: string, emailNew: string): Promise<void> {
    const activationToken = this.jwtService.sign({ emailOld, emailNew });

    await this.mailService.sendConfirmationEmailUpdated(emailNew, activationToken);
  }

  async confirmUpdateEmail(activationToken: string): Promise<void> {
    const decodedToken = this.jwtService.verify(activationToken);
    const { emailOld, emailNew } = decodedToken;

    const email = emailNew;

    const excistUser = await this.userRepository.findOne({ where: { email } });
    if (excistUser) {
      throw new Error('L\'utilisateur existe déjà.');
    }

    await this.updateEmailFromToken(decodedToken);
  }

  private async updateEmailFromToken(decodedToken: any): Promise<void> {
    const { emailOld, emailNew } = decodedToken;

    const email = emailOld;

    console.log(decodedToken);

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      user.email = emailNew;

      await user.save();
    } catch (e) {
      throw new InternalServerErrorException('Une erreur est survenue lors de la modification de l\'email.', decodedToken.emailOld);
    }
  }

  async uploadProfilePicture (userId: number, profilePictureName : string) : Promise<User>{
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (!user.profilePicture){
      throw new BadRequestException('Aucune image n\'est saisie');
    }

    user.profilePicture = profilePictureName;

    await user.save();

    return user;
  }

  async deleteProfilePicture(userId: number): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (!user.profilePicture) {
      throw new BadRequestException('Aucune image de profil à supprimer');
    }

    user.profilePicture = null;

    await user.save();
  }
}