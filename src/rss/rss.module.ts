import { Module } from '@nestjs/common';
import { RssService } from './rss.service';
import { RssController } from './rss.controller';
import {Rss} from "./entities/rss.entity";
import {SequelizeModule} from "@nestjs/sequelize";

@Module({
    imports: [
        SequelizeModule.forFeature([Rss]),
    ],
    controllers: [RssController],
    providers: [RssService],
    exports: [RssService]
})
export class RssModule {}
