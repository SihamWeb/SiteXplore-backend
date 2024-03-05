import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  HttpStatus,
  Res,
  Req,
  Query,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Delete,
  NotFoundException,
  Param
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import {AuthGuard} from "@nestjs/passport";
import {Response} from 'express';
import {FileInterceptor} from "@nestjs/platform-express";
import {diskStorage} from "multer";

interface FileParams {
  fileName: string;
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Get all users
  @Get()
  async findAll() {
    try {
      const users = await this.userService.findAll();
      return users;
    } catch (error) {
      throw new NotFoundException('Il y a des erreurs dans la récupération de tous les utilisateurs');
    }
  }

  // Get one user by id
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async findMe(@Req() req) {
    try {
      const userId = req.user.id;
      const user = await this.userService.findOne(userId);
      return user;
    } catch (error) {
      throw new NotFoundException(`Il y a des erreurs lors de la récupération de l'utilisateur connecté : ${error.message}`);
    }
  }

  //Users update their own informations
  @UseGuards(AuthGuard('jwt'))
  @Patch()
  async update(@Req() req, @Body() updateData: UpdateUserDto) {
    console.log(req.user);
    const userId = req.user.id;
    await this.userService.update(userId, updateData);
    return { message: 'Informations utilisateur mises à jour avec succès', updateData};
  }

  // Upload profile picture
  @UseGuards(AuthGuard('jwt'))
  @Patch('profile-picture')
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

    await this.userService.uploadProfilePicture(userId, profilePictureName);
    return { message: 'Informations utilisateur mises à jour avec succès', profilePictureName };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('profile-picture')
  async deleteProfilePicture(@Req() req) {
    const userId = req.user.id;
    await this.userService.deleteProfilePicture(userId);
    return { message: 'Image de profil supprimée avec succès' };
  }

  @Get('confirm-update-email')
  async confirmUpdateEmail(
      @Query('token') activationToken: string,
      @Res() res: Response
  ) {
    await this.userService.confirmUpdateEmail(activationToken);
    res.status(HttpStatus.OK).json({ message: 'Votre mise à jour d\'email a été confirmée avec succès.' });
  }
}
