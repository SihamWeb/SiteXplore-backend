import {Body, Controller, Get, Post, Req, UseGuards} from '@nestjs/common';
import {AuthenticationService} from "./authentication.service";
import {LocalGuard} from "./guards/local.guard";
import {Request} from 'express';
import {JwtAuthGuard} from "./guards/jwt.guard";
import {CreateUserDto} from "../user/dto/create-user.dto";
import {UserService} from "../user/user.service";

@Controller()
export class AuthenticationController {
    constructor(
        private authenticationService: AuthenticationService,
        private userService: UserService
    ) {}

    @Post('register')
    register(
        @Body() userData: CreateUserDto
    ) {
        return this.authenticationService.register(userData);
    }

    @Post('login')
    @UseGuards(LocalGuard)
    login(@Req() req: Request) {
        return req.user;
    }

    @Get('status')
    @UseGuards(JwtAuthGuard)
    status(@Req() req: Request) {
        console.log('Inside AuthController status method');
        console.log(req.user);
        return req.user;
    }
}
