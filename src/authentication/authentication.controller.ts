import {Body, Controller, Get, HttpStatus, Post, Query, Req, Res, UseGuards, Patch} from '@nestjs/common';
import {AuthenticationService} from "./authentication.service";
import {LocalGuard} from "./guards/local.guard";
import {Request, Response} from 'express';
import {JwtAuthGuard} from "./guards/jwt.guard";
import {CreateUserDto} from "../user/dto/create-user.dto";

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
}