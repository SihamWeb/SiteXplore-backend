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

    @Post('register')
    async register(
        @Body() userData: CreateUserDto,
        @Res() res: Response
    ): Promise<void> {
        const message = await this.authenticationService.register(userData);
        res.status(HttpStatus.CREATED).json({ message });
    }

    @Get('confirm-registration')
    async confirmRegistration(
        @Query('token') activationToken: string,
        @Res() res: Response
    ) {
        await this.authenticationService.confirmRegistration(activationToken);
        res.status(HttpStatus.OK).json({ message: 'Votre inscription a été confirmée avec succès.' });
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

    @Post('forgotten-password')
    async forgottenPassword(
        @Res() res,
        @Body() updateData: UpdateUserDto
    ): Promise<void> {
        const message = await this.authenticationService.forgottenPassword(updateData);
        res.status(HttpStatus.CREATED).json({ message });
    }

    @Get('update-forgotten-password')
    async updateForgottenPassword(
        @Query('token') activationToken: string,
        @Res() res: Response
    ) {
        await this.authenticationService.confirmForgottenPassword(activationToken);
        res.status(HttpStatus.OK).json({ message: 'Votre modification a été confirmée avec succès.' });
    }
}