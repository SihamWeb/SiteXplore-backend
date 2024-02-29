import {ConflictException, Injectable} from '@nestjs/common';
import {AuthenticationPayloadDto} from "./dto/authentication.dto";
import {JwtService} from "@nestjs/jwt";
import {User} from "../user/entities/user.entity";
import {CreateUserDto} from "../user/dto/create-user.dto";
import * as bcrypt from 'bcrypt';
import {InjectModel} from "@nestjs/sequelize";

@Injectable()
export class AuthenticationService {

    constructor(
        @InjectModel(User)
        private readonly userRepository: typeof User,
        private jwtService: JwtService
    ) {}

    async register(userData: CreateUserDto): Promise<User> {
        const { email, password, firstName, lastName } = userData;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const user = new User();
        user.email = email;
        user.password = hashedPassword;
        user.firstName = firstName;
        user.lastName = lastName;

        try {
            await user.save();
        } catch (e) {
            // Handle error appropriately
            throw e;
        }

        // Return the created user
        return user;
    }

    async validateUser({ email, password }: AuthenticationPayloadDto) {
        console.log('service authentication ok');
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