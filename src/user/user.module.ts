import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import {JwtStrategy} from "../authentication/strategies/jwt.strategy";
import {JwtModule} from "@nestjs/jwt";
import * as process from "process";
import {ConfigModule} from "@nestjs/config";
import {MailerModule} from "@nestjs-modules/mailer";
import {MailModule} from "../mail/mail.module";
import {SequelizeModule} from "@nestjs/sequelize";
import {User} from "./entities/user.entity";
import {PassportModule} from "@nestjs/passport";
import {LocalStrategy} from "../authentication/strategies/local.strategy";
import {AuthenticationService} from "../authentication/authentication.service";

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailerModule,
    MailModule,
    SequelizeModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: process.env.SECRET,
      signOptions: {
        expiresIn: '7d'
      },
    })
  ],
  controllers: [UserController],
  exports: [UserService],
  providers: [UserService, JwtStrategy, AuthenticationService],
})
export class UserModule {}