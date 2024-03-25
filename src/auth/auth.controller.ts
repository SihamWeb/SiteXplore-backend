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
  NotFoundException, Delete, BadRequestException, UseInterceptors, UploadedFile, Param
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {CreateUserDto} from "../user/dto/create-user.dto";
import {Response, Request} from "express";
import {LocalGuard} from "./guards/local.guard";
import {JwtAuthGuard} from "./guards/jwt.guard";
import {UpdateUserDto} from "../user/dto/update-user.dto";
import {AuthGuard} from "@nestjs/passport";
import {diskStorage} from "multer";
import {FileInterceptor} from "@nestjs/platform-express";

interface FileParams {
  fileName: string;
}

@Controller('auth')
export class AuthController {
  constructor(
      private readonly authService: AuthService,

  ) {}

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

  //User
  // Obtenir mes informations en étant connecté
  @UseGuards(AuthGuard('jwt'))
  @Get('user/me')
  async findMe(@Req() req) {
    try {
      const userId = req.user.id;
      const user = await this.authService.findMe(userId);
      return user;
    } catch (error) {
      throw new NotFoundException(`Il y a des erreurs lors de la récupération de l'utilisateur connecté : ${error.message}`);
    }
  }

  // Supprimer mon compte
  @UseGuards(AuthGuard('jwt'))
  @Delete('user/me')
  async removeMe(@Req() req) {
    try {
      const userId = req.user.id;
      const user = await this.authService.removeMe(userId);
      return user;
    } catch (error) {
      throw new NotFoundException(`Il y a des erreurs lors de la suppression de l'utilisateur connecté : ${error.message}`);
    }
  }

  // Modifier mes informations
  @UseGuards(AuthGuard('jwt'))
  @Patch('user')
  async update(@Req() req, @Body() updateData: UpdateUserDto) {
    console.log(req.user);
    const userId = req.user.id;
    await this.authService.update(userId, updateData);
    return { message: 'Informations utilisateur mises à jour avec succès', updateData};
  }

  // Confirmation email modification de mon email
  @Get('user/confirm-update-email')
  async confirmUpdateEmail(
      @Query('token') activationToken: string,
      @Res() res: Response
  ) {
    await this.authService.confirmUpdateEmail(activationToken);
    res.status(HttpStatus.OK).json({ message: 'Votre mise à jour d\'email a été confirmée avec succès.' });
  }

// Soumission d'une image de profil (utilisateur connecté)
  @UseGuards(AuthGuard('jwt'))
  @Patch('user/profile-picture')
  @UseInterceptors(FileInterceptor('profilePicture', {
    storage: diskStorage({
      destination: "./upload",
      filename: (req, file, cb) => {
        cb(null, `${file.originalname}`)
      }
    })
  }))
  async uploadFile(@Req() req, @UploadedFile() file: Express.Multer.File){
    if (!file) {
      throw new BadRequestException('Aucun fichier n\'a été téléchargé');
    }
    const userId = req.user.id;
    const profilePictureName = file.filename;

    await this.authService.uploadProfilePicture(userId, profilePictureName);
    return { message: 'Informations utilisateur mises à jour avec succès', profilePictureName };
  }

  // Suppression de mon image de profil
  @UseGuards(AuthGuard('jwt'))
  @Delete('user/profile-picture')
  async deleteProfilePicture(@Req() req) {
    const userId = req.user.id;
    await this.authService.deleteProfilePicture(userId);
    return { message: 'Image de profil supprimée avec succès' };
  }

  // SUppression d'un compte utilisateur inactif
  @Delete('user/inactive')
  async deleteInactiveUsers(@Res() res: Response): Promise<void> {
    const message = await this.authService.deleteInactiveUsers();
    res.status(HttpStatus.OK).json({ message });
  }

  // Admin
  // Modifier le rôle des utilisateurs
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/role/:userId')
  async updateAdminRole(
      @Param('userId') userId: number,
      @Body() updateData: { isAdmin: boolean },
      @Req() req,
  ) {
    const reqesterId = req.user.id;
    return this.authService.updateAdminRole(userId, updateData.isAdmin, reqesterId);
  }

  // Supprimer un utilisateur (besoin du rôle admin)
  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/:userId')
  async deleteUser(
      @Param('userId') userId: number,
      @Req() req,
  ) {
    const reqesterId = req.user.id;
    return this.authService.deleteUser(userId, reqesterId);
  }

  // Obtenir tous les utilisateurs (besoin du rôle admin)
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/users')
  async findAll(@Req() req) {
    const reqesterId = req.user.id;
    return this.authService.findAll(reqesterId);
  }

  // Obtenir les informations d'un utilisateur (besoin du rôle admin)
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/user/:userId')
  async findOne(
      @Param('userId') userId: number,
      @Req() req) {
    const reqesterId = req.user.id;
    return this.authService.findOne(userId, reqesterId);
  }

}
