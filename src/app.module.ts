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
import { RssModule } from './rss/rss.module';
import { MediaModule } from './media/media.module';
import {Rss} from "./rss/entities/rss.entity";
import {Author} from "./rss/entities/author.entity";
import {ArticleAuthor} from "./rss/entities/article-author.entity";
import {Category} from "./rss/entities/category.entity";
import {ArticleCategory} from "./rss/entities/article-category.entity";
import {Media} from "./rss/entities/media.entity";
import {ScheduleModule} from "@nestjs/schedule";
import { ContactModule } from './contact/contact.module';
import { LocationModule } from './location/location.module';
import {Location} from "./location/entities/location.entity";


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
            models: [
              User, 
              Rss, 
              Author, 
              ArticleAuthor, 
              Category, 
              ArticleCategory, 
              Media,
              Location
            ],
        }),
        ScheduleModule.forRoot(),
        RssModule,
        MediaModule,
        AuthenticationModule,
        UserModule,
        MailModule,
        ContactModule,
        LocationModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}