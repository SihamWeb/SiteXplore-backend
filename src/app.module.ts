import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { RssModule } from './rss/rss.module';
import { MediaModule } from './media/media.module';
import * as process from "process";
import {Rss} from "./rss/entities/rss.entity";
import {Author} from "./rss/entities/author.entity";
import {ArticleAuthor} from "./rss/entities/article-author.entity";

@Module({
  imports: [
      ConfigModule.forRoot(),
      SequelizeModule.forRoot({
        dialect: 'mysql',
        host: process.env.DB_HOST,
        port: 3306,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        models: [Rss, Author, ArticleAuthor],
      }),
      RssModule,
      MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
