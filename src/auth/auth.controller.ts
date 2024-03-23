import {Body, Controller, Get, HttpStatus, Post, Query, Req, Res, UseGuards, Patch} from '@nestjs/common';
import { AuthService } from './auth.service';
import {CreateUserDto} from "../user/dto/create-user.dto";
import {Response, Request} from "express";
import {LocalGuard} from "./guards/local.guard";
import {JwtAuthGuard} from "./guards/jwt.guard";
import {UpdateUserDto} from "../user/dto/update-user.dto";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
      @Body() userData: CreateUserDto,
      @Res() res: Response
  ): Promise<void> {
    const message = await this.authService.register(userData);
    res.status(HttpStatus.CREATED).json({ message });
  }

  // Inscription confirmé par mail
  @Get('confirm-registration')
  async confirmRegistration(
      @Query('token') activationToken: string,
      @Res() res: Response
  ) {
    console.log('CONFIRM REGISTRATION CONTROLLER');
    await this.authService.confirmRegistration(activationToken);
    res.redirect('http://localhost:4200/mon-compte');
  }

  // Connexion
  @Post('login')
  @UseGuards(LocalGuard)
  async login(@Req() req: Request, @Res() res: Response) {
    const { email, password } = req.body;
    const message = await this.authService.validateUser({ email, password });
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
    const message = await this.authService.forgottenPassword(updateData);
    res.status(HttpStatus.CREATED).json({ message });
  }

  // Modification du mot de passe oublié confirmée par mail
  @Get('update-forgotten-password')
  async updateForgottenPassword(
      @Query('token') activationToken: string,
      @Res() res: Response
  ) {
    await this.authService.confirmForgottenPassword(activationToken);
    res.status(HttpStatus.OK).json({ message: 'Votre modification a été confirmée avec succès.' });
  }

}
