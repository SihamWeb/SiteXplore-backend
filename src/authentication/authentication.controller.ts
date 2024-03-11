import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
    Patch,
    UnauthorizedException
} from '@nestjs/common';
import {AuthenticationService} from "./authentication.service";
import {LocalGuard} from "./guards/local.guard";
import {Request, Response} from 'express';
import {JwtAuthGuard} from "./guards/jwt.guard";
import {CreateUserDto} from "../user/dto/create-user.dto";
import {UpdateUserDto} from "../user/dto/update-user.dto";
import {AuthGuard} from "@nestjs/passport";
import {CheckTokenExpiryGuard} from "./guards/authentication.guard";


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

    // help with https://blog.stackademic.com/integrating-google-login-with-nestjs-using-passport-js-0f25e02e503b

    @Get('auth/google')
    @UseGuards(AuthGuard('google'))
    googleLogin() {}

    @Get('auth/google/callback')
    @UseGuards(AuthGuard('google'))
    googleLoginCallback(@Req() req, @Res() res) {
        const googleToken = req.user.accessToken;
        const googleRefreshToken = req.user.refreshToken;

        res.cookie('access_token', googleToken, { httpOnly: true });
        res.cookie('refresh_token', googleRefreshToken, {
            httpOnly: true,
        });

        res.redirect('http://localhost:3000/auth/google/profile');
    }

    @UseGuards(CheckTokenExpiryGuard)
    @Get('auth/google/profile')
    async getProfile(@Req() req) {
        const accessToken = req.cookies['access_token'];
        if (accessToken)
            return (await this.authenticationService.getProfile(accessToken)).data;
        throw new UnauthorizedException('No access token');
    }

    @Get('auth/google/logout')
    logout(@Req() req, @Res() res: Response) {
        const refreshToken = req.cookies['refresh_token'];
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        this.authenticationService.revokeGoogleToken(refreshToken);
        res.redirect('http://localhost:3000/');
    }
}