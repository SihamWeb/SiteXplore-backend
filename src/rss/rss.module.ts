import { Module } from '@nestjs/common';
import { RssService } from './rss.service';
import { RssController } from './rss.controller';
import {Rss} from "./entities/rss.entity";
import {SequelizeModule} from "@nestjs/sequelize";
import {ArticleAuthor} from "./entities/article-author.entity";
import {Author} from "./entities/author.entity";
import {Category} from "./entities/category.entity";
import {ArticleCategory} from "./entities/article-category.entity";
import {Media} from "./entities/media.entity";

@Module({
    imports: [
        SequelizeModule.forFeature([Rss, ArticleAuthor, Author, Category, ArticleCategory, Media]),
    ],
    controllers: [RssController],
    providers: [RssService],
    exports: [RssService]
})
export class RssModule {}
