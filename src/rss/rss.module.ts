import { Module } from '@nestjs/common';
import { RssService } from './rss.service';
import { RssController } from './rss.controller';
import {Rss} from "./entities/rss.entity";
import {SequelizeModule} from "@nestjs/sequelize";
import {ArticleAuthor} from "./entities/article-author.entity";
import {Author} from "./entities/author.entity";

@Module({
    imports: [
        SequelizeModule.forFeature([Rss, ArticleAuthor, Author]),
    ],
    controllers: [RssController],
    providers: [RssService],
    exports: [RssService]
})
export class RssModule {}
