import { Module } from '@nestjs/common';
import {JwtModule} from "@nestjs/jwt";
import {PassportModule} from "@nestjs/passport";
import {LocalStrategy} from "./strategies/local.strategy";
import {JwtStrategy} from "./strategies/jwt.strategy";
import {SequelizeModule} from "@nestjs/sequelize";
import {User} from "../user/entities/user.entity";
import {UserModule} from "../user/user.module";
import * as process from "process";
import { ConfigModule } from '@nestjs/config';
import {MailerModule} from "@nestjs-modules/mailer";
import {MailModule} from "../mail/mail.module";
import {AuthService} from "./auth.service";
import {AuthController} from "./auth.controller";

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailerModule,
    MailModule,
    UserModule,
    SequelizeModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: process.env.SECRET,
      signOptions: {
        expiresIn: '45m'
      },
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
