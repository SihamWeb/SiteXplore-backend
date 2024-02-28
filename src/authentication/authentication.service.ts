import { Injectable } from '@nestjs/common';
import {AuthenticationPayloadDto} from "./dto/authentication.dto";
import {JwtService} from "@nestjs/jwt";
import {User} from "../user/entities/user.entity";

@Injectable()
export class AuthenticationService {

    constructor(private jwtService: JwtService) {}

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
