import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {ConfigModule, ConfigService} from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthenticationModule } from './authentication/authentication.module';
import { UserModule } from './user/user.module';
import * as process from "process";
import {User} from "./user/entities/user.entity";
import { MailModule } from './mail/mail.module';
import {HandlebarsAdapter} from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import {MailerModule} from "@nestjs-modules/mailer";
import path from "path";

@Module({
    imports: [
        ConfigModule.forRoot({
                isGlobal: true,
        }),
        SequelizeModule.forRoot({
            dialect: 'mysql',
            host: process.env.DB_HOST,
            port: 3306,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            models: [User],
        }),
        AuthenticationModule,
        UserModule,
        MailModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}