import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { RssModule } from './rss/rss.module';
import { MediaModule } from './media/media.module';
import * as process from "process";

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
        models: [],
      }),
      RssModule,
      MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
