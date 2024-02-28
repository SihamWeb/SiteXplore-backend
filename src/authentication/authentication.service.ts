import { Injectable } from '@nestjs/common';
import {AuthenticationPayloadDto} from "./dto/authentication.dto";
import {JwtService} from "@nestjs/jwt";

const fakeUsers = [
    {
        id: 1,
        email: "test@gmail.com",
        password: "password",
    },
    {
        id: 2,
        email: "test2@gmail.com",
        password: "password2",
    },
    {
        id: 3,
        email: "test3@gmail.com",
        password: "password3",
    }
]

@Injectable()
export class AuthenticationService {

    constructor(private jwtService: JwtService) {

    }

    validateUser({ email, password } : AuthenticationPayloadDto){
        console.log('service authentication ok');
        const findUser =
            fakeUsers.find(
                (user) => user.email === email);
        if (!findUser) return null;
        if(password === findUser.password){
            const { password, ...user } = findUser;
            return this.jwtService.sign(user);
        }
    }
}
