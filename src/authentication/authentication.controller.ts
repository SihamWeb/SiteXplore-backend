import {Body, Controller, Get, Post, Req, UseGuards} from '@nestjs/common';
import {AuthenticationService} from "./authentication.service";
import {LocalGuard} from "./guards/local.guard";
import {Request} from 'express';
import {JwtAuthGuard} from "./guards/jwt.guard";

@Controller('auth')
export class AuthenticationController {
    constructor(private authenticationService: AuthenticationService) {}

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
