import {ConflictException, Injectable, InternalServerErrorException} from '@nestjs/common';
import {AuthenticationPayloadDto} from "./dto/authentication.dto";
import {JwtService} from "@nestjs/jwt";
import {User} from "../user/entities/user.entity";
import {CreateUserDto} from "../user/dto/create-user.dto";
import * as bcrypt from 'bcrypt';
import {InjectModel} from "@nestjs/sequelize";
import {MailerService} from "@nestjs-modules/mailer";
import {MailService} from "../mail/mail.service";
import {last} from "rxjs";

@Injectable()
export class AuthenticationService {

    constructor(
        @InjectModel(User)
        private readonly userRepository: typeof User,
        private jwtService: JwtService,
        private mailerService: MailerService,
        private mailService: MailService
    ) {}

    async register(userData: CreateUserDto): Promise<void> {
        const { email, firstName, lastName, password } = userData;
        const activationToken = this.jwtService.sign({ email, password, lastName, firstName });
        await this.mailService.sendConfirmationEmail(userData, activationToken);
    }

    async confirmRegistration(activationToken: string): Promise<void> {
        const decodedToken = this.jwtService.verify(activationToken);
        const { email, password, lastName, firstName } = decodedToken;

        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
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
        if (!user){
            return null;
        }
        if (user.password === password) {
            const { password, ...userWithoutThePassword } = user.toJSON();
            return this.jwtService.sign(userWithoutThePassword);
        }
        return null;
    }
}