import {Body, Controller, Get, HttpStatus, Post, Query, Req, Res, UseGuards, Patch} from '@nestjs/common';
import {AuthenticationService} from "./authentication.service";
import {LocalGuard} from "./guards/local.guard";
import {Request, Response} from 'express';
import {JwtAuthGuard} from "./guards/jwt.guard";
import {CreateUserDto} from "../user/dto/create-user.dto";
import {UpdateUserDto} from "../user/dto/update-user.dto";

@Controller()
export class AuthenticationController {
    constructor(
        private authenticationService: AuthenticationService,
    ) {}

    // Inscription
    @Post('register')
    async register(
        @Body() userData: CreateUserDto,
        @Res() res: Response
    ): Promise<void> {
        const message = await this.authenticationService.register(userData);
        res.status(HttpStatus.CREATED).json({ message });
    }

    // Inscription confirmé par mail
    @Get('confirm-registration')
    async confirmRegistration(
        @Query('token') activationToken: string,
        @Res() res: Response
    ) {
        await this.authenticationService.confirmRegistration(activationToken);
        res.redirect('http://localhost:4200/mon-compte');
    }

    // Connexion
    @Post('login')
    @UseGuards(LocalGuard)
    async login(@Req() req: Request, @Res() res: Response) {
        const { email, password } = req.body;
        const message = await this.authenticationService.validateUser({ email, password });
        res.status(HttpStatus.CREATED).json({ message });
    }

    // Obtenir les données de l'utilisateur authentifié,
    // si la requête contient un JWT valide
    @Get('status')
    @UseGuards(JwtAuthGuard)
    status(@Req() req: Request) {
        console.log('Inside AuthController status method');
        console.log(req.user);
        return req.user;
    }

    // Mot de passe oublié
    @Post('forgotten-password')
    async forgottenPassword(
        @Res() res,
        @Body() updateData: UpdateUserDto
    ): Promise<void> {
        const message = await this.authenticationService.forgottenPassword(updateData);
        res.status(HttpStatus.CREATED).json({ message });
    }

    // Modification du mot de passe oublié confirmée par mail
    @Get('update-forgotten-password')
    async updateForgottenPassword(
        @Query('token') activationToken: string,
        @Res() res: Response
    ) {
        await this.authenticationService.confirmForgottenPassword(activationToken);
        res.status(HttpStatus.OK).json({ message: 'Votre modification a été confirmée avec succès.' });
    }
}