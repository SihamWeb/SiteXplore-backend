import {Body, Controller, Get, HttpStatus, Post, Query, Req, Res, UseGuards, Redirect} from '@nestjs/common';
import {AuthenticationService} from "./authentication.service";
import {LocalGuard} from "./guards/local.guard";
import {Request, Response} from 'express';
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
    async register(
        @Body() userData: CreateUserDto,
        @Res() res: Response
    ) {
        await this.authenticationService.register(userData);
        res.status(HttpStatus.CREATED).json({ message: 'Un email de confirmation a été envoyé avec succès.' });
    }

    @Get('confirm-registration')
    async confirmRegistration(
        @Query('token') activationToken: string,
        @Res() res: Response
    ) {
        await this.authenticationService.confirmRegistration(activationToken);
        res.status(HttpStatus.OK).json({ message: 'Votre inscription a été confirmée avec succès.' });
        // return res.redirect('page d'accueil ou espace membre?);
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
