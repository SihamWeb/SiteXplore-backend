import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  HttpStatus, Res, Req, Query
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import {AuthGuard} from "@nestjs/passport";
import {Request, Response} from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  //Users update their own informations
  @UseGuards(AuthGuard('jwt'))
  @Patch('auth/update')
  async update(@Req() req, @Body() updateData: UpdateUserDto) {
    console.log(req.user);
    const userId = req.user.id;
    await this.userService.update(userId, updateData);
    return { message: 'Informations utilisateur mises à jour avec succès', updateData};
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
