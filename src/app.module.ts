import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {ConfigModule} from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModule } from './user/user.module';
import * as process from "process";
import {User} from "./user/entities/user.entity";
import { MailModule } from './mail/mail.module';
import { RssModule } from './rss/rss.module';
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
import { AuthModule } from './auth/auth.module';


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
        UserModule,
        MailModule,
        ContactModule,
        LocationModule,
        AuthModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}