import { Module } from '@nestjs/common';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import {JwtModule} from "@nestjs/jwt";
import {PassportModule} from "@nestjs/passport";
import {LocalStrategy} from "./strategies/local.strategy";
import {JwtStrategy} from "./strategies/jwt.strategy";
import {SequelizeModule} from "@nestjs/sequelize";
import {User} from "../user/entities/user.entity";
import {UserModule} from "../user/user.module";
import * as process from "process";
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot(),
        UserModule,
        SequelizeModule.forFeature([User]),
        PassportModule,
        JwtModule.register({
            secret: process.env.SECRET,
            signOptions: {
                expiresIn: '1h'
            },
        })
    ],
    controllers: [AuthenticationController],
    providers: [AuthenticationService, LocalStrategy, JwtStrategy]
})
export class AuthenticationModule {}